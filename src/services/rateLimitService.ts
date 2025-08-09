import { supabase } from '../integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  message?: string;
  limit?: number;
}

export interface UsageLimits {
  singleCheck: {
    used: number;
    limit: number;
    resetTime: number;
  };
  groupAnalysis: {
    used: number;
    limit: number;
    resetTime: number;
  };
  aiAnalysis: {
    used: number;
    limit: number;
    resetTime: number;
  };
}

class RateLimitService {
  private cache: Map<string, { result: RateLimitResult; timestamp: number }>;
  private cacheTimeout = 60000; // 1 minute cache

  constructor() {
    // Initialize Map in constructor to avoid module-level execution
    this.cache = new Map();
  }

  async checkRateLimit(endpoint: string, consumeRequest: boolean = true): Promise<RateLimitResult> {
    const cacheKey = `${endpoint}-${consumeRequest}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: Date.now() + 60000,
          message: 'Authentication required',
        };
      }

      const { data, error } = await supabase.functions.invoke('rate-limiter', {
        body: { 
          endpoint,
          action: consumeRequest ? 'consume' : 'check'
        },
      });

      if (error) {
        logger.error('Rate limit check failed:', { error, endpoint });
        
        // Fallback to client-side rate limiting
        return this.clientSideRateLimit(endpoint, consumeRequest);
      }

      const result: RateLimitResult = {
        allowed: data.allowed,
        remaining: data.remaining,
        resetTime: data.resetTime,
        message: data.message,
      };

      // Cache the result
      this.cache.set(cacheKey, { result, timestamp: Date.now() });

      return result;

    } catch (error) {
      logger.error('Rate limit service error:', { error, endpoint });
      return this.clientSideRateLimit(endpoint, consumeRequest);
    }
  }

  private clientSideRateLimit(endpoint: string, consumeRequest: boolean): RateLimitResult {
    // Fallback client-side rate limiting using localStorage
    const storageKey = `rateLimit_${endpoint}`;
    const stored = localStorage.getItem(storageKey);
    
    const limits = {
      'single-check': { max: 3, window: 60 * 60 * 1000 }, // 3 per hour
      'group-analysis': { max: 1, window: 24 * 60 * 60 * 1000 }, // 1 per day
      'ai-language-analysis': { max: 2, window: 60 * 60 * 1000 }, // 2 per hour
    };

    const config = limits[endpoint as keyof typeof limits] || { max: 5, window: 60 * 60 * 1000 };
    const now = Date.now();

    if (stored) {
      const data = JSON.parse(stored);
      const windowStart = data.windowStart || now;
      
      if (now - windowStart < config.window) {
        // Within current window
        const currentCount = consumeRequest ? data.count + 1 : data.count;
        
        if (currentCount > config.max) {
          return {
            allowed: false,
            remaining: 0,
            resetTime: windowStart + config.window,
            message: `Rate limit exceeded. Limit: ${config.max} requests per ${config.window / 1000 / 60} minutes.`,
          };
        }

        if (consumeRequest) {
          localStorage.setItem(storageKey, JSON.stringify({
            count: currentCount,
            windowStart,
          }));
        }

        return {
          allowed: true,
          remaining: config.max - currentCount,
          resetTime: windowStart + config.window,
        };
      } else {
        // New window
        const count = consumeRequest ? 1 : 0;
        
        if (consumeRequest) {
          localStorage.setItem(storageKey, JSON.stringify({
            count,
            windowStart: now,
          }));
        }

        return {
          allowed: true,
          remaining: config.max - count,
          resetTime: now + config.window,
        };
      }
    } else {
      // First request
      const count = consumeRequest ? 1 : 0;
      
      if (consumeRequest) {
        localStorage.setItem(storageKey, JSON.stringify({
          count,
          windowStart: now,
        }));
      }

      return {
        allowed: true,
        remaining: config.max - count,
        resetTime: now + config.window,
      };
    }
  }

  async getCurrentUsage(): Promise<UsageLimits | null> {
    try {
      const [singleCheck, groupAnalysis, aiAnalysis] = await Promise.all([
        this.checkRateLimit('single-check', false),
        this.checkRateLimit('group-analysis', false),
        this.checkRateLimit('ai-language-analysis', false),
      ]);

      return {
        singleCheck: {
          used: (singleCheck.limit || 0) - singleCheck.remaining,
          limit: singleCheck.limit || 0,
          resetTime: singleCheck.resetTime,
        },
        groupAnalysis: {
          used: (groupAnalysis.limit || 0) - groupAnalysis.remaining,
          limit: groupAnalysis.limit || 0,
          resetTime: groupAnalysis.resetTime,
        },
        aiAnalysis: {
          used: (aiAnalysis.limit || 0) - aiAnalysis.remaining,
          limit: aiAnalysis.limit || 0,
          resetTime: aiAnalysis.resetTime,
        },
      };
    } catch (error) {
      logger.error('Failed to get current usage:', { error });
      return null;
    }
  }

  formatTimeUntilReset(resetTime: number): string {
    const now = Date.now();
    const diff = resetTime - now;
    
    if (diff <= 0) {
      return 'Available now';
    }

    const minutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Tier-specific limits
  getTierLimits(tier: string = 'free'): Record<string, { maxRequests: number; windowMs: number }> {
    const limits = {
      free: {
        'single-check': { maxRequests: 3, windowMs: 60 * 60 * 1000 },
        'group-analysis': { maxRequests: 1, windowMs: 24 * 60 * 60 * 1000 },
        'ai-language-analysis': { maxRequests: 2, windowMs: 60 * 60 * 1000 },
      },
      basic: {
        'single-check': { maxRequests: 20, windowMs: 60 * 60 * 1000 },
        'group-analysis': { maxRequests: 5, windowMs: 24 * 60 * 60 * 1000 },
        'ai-language-analysis': { maxRequests: 15, windowMs: 60 * 60 * 1000 },
      },
      premium: {
        'single-check': { maxRequests: 100, windowMs: 60 * 60 * 1000 },
        'group-analysis': { maxRequests: 20, windowMs: 24 * 60 * 60 * 1000 },
        'ai-language-analysis': { maxRequests: 50, windowMs: 60 * 60 * 1000 },
      },
      pro: {
        'single-check': { maxRequests: 1000, windowMs: 60 * 60 * 1000 },
        'group-analysis': { maxRequests: 100, windowMs: 24 * 60 * 60 * 1000 },
        'ai-language-analysis': { maxRequests: 200, windowMs: 60 * 60 * 1000 },
      },
    };

    return limits[tier as keyof typeof limits] || limits.free;
  }
}

export const rateLimitService = new RateLimitService();