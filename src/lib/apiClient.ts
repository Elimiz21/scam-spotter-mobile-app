// Comprehensive API client with retry logic, circuit breaker, and caching
import { supabase } from '@/integrations/supabase/client';
import { appConfig } from '@/config/environment';
import { logger } from './logger';
import { 
  AppError, 
  createExternalApiError, 
  createRateLimitError,
  withRetry,
  CircuitBreaker,
  createInternalError,
  createUnauthorizedError
} from './errorHandler';
import { sanitizeInput } from './inputValidation';

// Request configuration
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
  sanitize?: boolean;
  requiresAuth?: boolean;
}

// Response interface
export interface ApiResponse<T = any> {
  data?: T;
  error?: AppError;
  headers?: Headers;
  status?: number;
}

// Cache implementation
class SimpleCache {
  private cache = new Map<string, { data: any; expiry: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  set(key: string, data: any, ttl: number) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// Performance monitoring
class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  recordMetric(endpoint: string, duration: number) {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }
    
    const metrics = this.metrics.get(endpoint)!;
    metrics.push(duration);
    
    // Keep only last 100 metrics
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  getMetrics(endpoint: string) {
    const metrics = this.metrics.get(endpoint);
    
    if (!metrics || metrics.length === 0) {
      return null;
    }
    
    const sorted = [...metrics].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    
    return {
      count: sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  getAllMetrics() {
    const allMetrics: Record<string, any> = {};
    
    for (const [endpoint, _] of this.metrics.entries()) {
      allMetrics[endpoint] = this.getMetrics(endpoint);
    }
    
    return allMetrics;
  }
}

// Main API Client class
export class ApiClient {
  private cache = new SimpleCache();
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private performanceMonitor = new PerformanceMonitor();
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private maxConcurrentRequests = 5;
  private activeRequests = 0;

  constructor(private baseUrl?: string) {}

  // Get or create circuit breaker for an endpoint
  private getCircuitBreaker(endpoint: string): CircuitBreaker {
    if (!this.circuitBreakers.has(endpoint)) {
      this.circuitBreakers.set(endpoint, new CircuitBreaker());
    }
    return this.circuitBreakers.get(endpoint)!;
  }

  // Generate cache key
  private getCacheKey(url: string, config?: RequestConfig): string {
    const params = config?.params ? JSON.stringify(config.params) : '';
    return `${config?.method || 'GET'}:${url}:${params}`;
  }

  // Get authentication headers
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw createUnauthorizedError('No active session');
    }
    
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'x-user-id': session.user.id,
    };
  }

  // Build full URL with query params
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = this.baseUrl 
      ? `${this.baseUrl}${endpoint}`
      : endpoint;
    
    if (!params || Object.keys(params).length === 0) {
      return url;
    }
    
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    
    return `${url}?${searchParams.toString()}`;
  }

  // Process request queue
  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
      const request = this.requestQueue.shift();
      
      if (request) {
        this.activeRequests++;
        
        request()
          .finally(() => {
            this.activeRequests--;
            this.processQueue();
          });
      }
    }
    
    this.isProcessingQueue = false;
  }

  // Queue a request
  private queueRequest<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  // Main request method
  async request<T = any>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const method = config?.method || 'GET';
    const cacheKey = this.getCacheKey(endpoint, config);
    
    // Check cache for GET requests
    if (method === 'GET' && config?.cache) {
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        logger.debug('Cache hit', { endpoint, cacheKey });
        return { data: cached };
      }
    }
    
    // Build request
    const url = this.buildUrl(endpoint, method === 'GET' ? config?.params : undefined);
    
    // Get headers
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config?.headers,
    };
    
    if (config?.requiresAuth) {
      try {
        const authHeaders = await this.getAuthHeaders();
        headers = { ...headers, ...authHeaders };
      } catch (error) {
        return { error: error as AppError };
      }
    }
    
    // Prepare body
    let body: string | undefined;
    
    if (config?.body && method !== 'GET') {
      const sanitized = config.sanitize 
        ? sanitizeInput(config.body)
        : config.body;
      
      body = JSON.stringify(sanitized);
    }
    
    // Create fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
      body,
    };
    
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      config?.timeout || 30000
    );
    
    fetchOptions.signal = controller.signal;
    
    // Execute request with circuit breaker
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    
    try {
      const response = await circuitBreaker.execute(async () => {
        // Execute with retry logic
        return await withRetry(
          async () => {
            const res = await fetch(url, fetchOptions);
            
            clearTimeout(timeoutId);
            
            // Handle rate limiting
            if (res.status === 429) {
              const retryAfter = res.headers.get('Retry-After');
              throw createRateLimitError(
                retryAfter ? parseInt(retryAfter, 10) : undefined
              );
            }
            
            // Handle other errors
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}));
              
              throw createExternalApiError(
                endpoint,
                new Error(errorData.message || `HTTP ${res.status}`),
                {
                  status: res.status,
                  endpoint,
                  method,
                }
              );
            }
            
            return res;
          },
          {
            maxAttempts: config?.retries || 3,
            delay: 1000,
            backoff: 'exponential',
            shouldRetry: (error) => {
              // Don't retry on client errors (except rate limit)
              if (error instanceof AppError) {
                return error.statusCode === 429 || error.statusCode >= 500;
              }
              return true;
            },
          }
        );
      });
      
      // Parse response
      const data = await response.json().catch(() => null);
      
      // Record performance metrics
      const duration = Date.now() - startTime;
      this.performanceMonitor.recordMetric(endpoint, duration);
      
      // Cache successful GET requests
      if (method === 'GET' && config?.cache && data) {
        const ttl = config.cacheTTL || 5 * 60 * 1000; // 5 minutes default
        this.cache.set(cacheKey, data, ttl);
      }
      
      logger.debug('API request successful', {
        endpoint,
        method,
        duration,
        status: response.status,
      });
      
      return {
        data,
        headers: response.headers,
        status: response.status,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('API request failed', {
        endpoint,
        method,
        duration,
        error: error instanceof Error ? error.message : error,
      });
      
      if (error instanceof AppError) {
        return { error };
      }
      
      return {
        error: createInternalError(
          'Request failed',
          error as Error,
          { endpoint, method }
        ),
      };
    }
  }

  // Convenience methods
  async get<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    config?: Omit<RequestConfig, 'method' | 'params'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'GET',
      params,
    });
  }

  async post<T = any>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body,
    });
  }

  async put<T = any>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body,
    });
  }

  async patch<T = any>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body,
    });
  }

  async delete<T = any>(
    endpoint: string,
    config?: Omit<RequestConfig, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
    });
  }

  // Batch requests
  async batch<T = any>(
    requests: Array<{
      endpoint: string;
      config?: RequestConfig;
    }>
  ): Promise<ApiResponse<T>[]> {
    return Promise.all(
      requests.map(({ endpoint, config }) => 
        this.queueRequest(() => this.request<T>(endpoint, config))
      )
    );
  }

  // Clear cache
  clearCache(endpoint?: string) {
    if (endpoint) {
      // Clear specific endpoint cache
      const pattern = new RegExp(`^[^:]+:${endpoint}`);
      // Note: SimpleCache doesn't support pattern matching, 
      // so we'd need to enhance it or clear all
      this.cache.clear();
    } else {
      this.cache.clear();
    }
  }

  // Get performance metrics
  getPerformanceMetrics(endpoint?: string) {
    if (endpoint) {
      return this.performanceMonitor.getMetrics(endpoint);
    }
    
    return this.performanceMonitor.getAllMetrics();
  }

  // Get circuit breaker status
  getCircuitBreakerStatus(endpoint?: string) {
    if (endpoint) {
      const breaker = this.circuitBreakers.get(endpoint);
      return breaker ? breaker.getState() : null;
    }
    
    const status: Record<string, any> = {};
    
    for (const [ep, breaker] of this.circuitBreakers.entries()) {
      status[ep] = breaker.getState();
    }
    
    return status;
  }

  // Cleanup
  destroy() {
    this.cache.destroy();
    this.circuitBreakers.clear();
    this.requestQueue = [];
  }
}

// Create singleton instances for different services
export const apiClient = new ApiClient(appConfig.supabase.url);
export const externalApiClient = new ApiClient();

// Supabase-specific API client
export class SupabaseApiClient extends ApiClient {
  constructor() {
    super(appConfig.supabase.url);
  }

  // Call Supabase edge function
  async callFunction<T = any>(
    functionName: string,
    body?: any,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.post<T>(
      `/functions/v1/${functionName}`,
      body,
      {
        ...config,
        requiresAuth: true,
        headers: {
          ...config?.headers,
          'x-function-name': functionName,
        },
      }
    );
  }
}

export const supabaseApi = new SupabaseApiClient();