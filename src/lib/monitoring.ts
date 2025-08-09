interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
  FATAL: 4;
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
};

interface LogEntry {
  timestamp: string;
  level: keyof LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  performance?: {
    duration?: number;
    memoryUsed?: number;
  };
}

interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: string;
}

class MonitoringService {
  private logLevel: keyof LogLevel = 'INFO';
  private buffer: LogEntry[] = [];
  private maxBufferSize = 100;
  private sessionId: string;
  private userId?: string;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setLogLevel();
    this.startPerformanceMonitoring();
    this.setupGlobalErrorHandlers();
    this.startAutoFlush();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setLogLevel(): void {
    // Use import.meta.env for Vite
    let isDev = false;
    try {
      isDev = import.meta?.env?.MODE === 'development';
    } catch {
      isDev = false;
    }
    const envLevel = isDev ? 'DEBUG' : 'INFO';
    this.logLevel = envLevel as keyof LogLevel;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  clearUserId(): void {
    this.userId = undefined;
  }

  private shouldLog(level: keyof LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.logLevel];
  }

  private createLogEntry(
    level: keyof LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.userId,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('DEBUG')) {
      const entry = this.createLogEntry('DEBUG', message, context);
      this.addToBuffer(entry);
      console.debug(`[DEBUG] ${message}`, context);
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('INFO')) {
      const entry = this.createLogEntry('INFO', message, context);
      this.addToBuffer(entry);
      console.info(`[INFO] ${message}`, context);
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('WARN')) {
      const entry = this.createLogEntry('WARN', message, context);
      this.addToBuffer(entry);
      console.warn(`[WARN] ${message}`, context);
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (this.shouldLog('ERROR')) {
      const entry = this.createLogEntry('ERROR', message, context, error);
      this.addToBuffer(entry);
      console.error(`[ERROR] ${message}`, error, context);
      
      // Send critical errors immediately
      this.sendToExternalService([entry]);
    }
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    if (this.shouldLog('FATAL')) {
      const entry = this.createLogEntry('FATAL', message, context, error);
      this.addToBuffer(entry);
      console.error(`[FATAL] ${message}`, error, context);
      
      // Send fatal errors immediately and flush all logs
      this.flush();
    }
  }

  private addToBuffer(entry: LogEntry): void {
    this.buffer.push(entry);
    
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  private startPerformanceMonitoring(): void {
    // Monitor page load performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          try {
            // Check if getEntriesByType is available
            if (typeof performance.getEntriesByType !== 'function') {
              this.debug('Performance.getEntriesByType not available');
              return;
            }
            
            const entries = performance.getEntriesByType('navigation');
            if (!entries || entries.length === 0) {
              this.debug('No navigation performance entries available');
              return;
            }
            
            const perfData = entries[0] as PerformanceNavigationTiming;
            
            this.info('Page load performance', {
              loadTime: perfData.loadEventEnd - perfData.fetchStart,
              domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
              firstPaint: this.getFirstPaint(),
              memoryUsage: this.getMemoryUsage(),
            });
          } catch (error) {
            this.debug('Could not collect performance metrics', { error: String(error) });
          }
        }, 0);
      });

      // Monitor long tasks
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (entry.duration > 50) { // Tasks longer than 50ms
                this.warn('Long task detected', {
                  duration: entry.duration,
                  startTime: entry.startTime,
                });
              }
            });
          });
          observer.observe({ entryTypes: ['longtask'] });
        } catch (e) {
          // PerformanceObserver not supported
        }
      }
    }
  }

  private getFirstPaint(): number | undefined {
    try {
      if (typeof window !== 'undefined' && 'performance' in window && typeof performance.getEntriesByType === 'function') {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint?.startTime;
      }
    } catch (error) {
      // Silently fail if not supported
    }
    return undefined;
  }

  private getMemoryUsage(): number | undefined {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      // @ts-ignore - performance.memory is non-standard
      return performance.memory?.usedJSHeapSize;
    }
    return undefined;
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      // Catch unhandled JavaScript errors
      window.addEventListener('error', (event) => {
        this.error('Unhandled JavaScript error', event.error, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      });

      // Catch unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled promise rejection', undefined, {
          reason: event.reason,
          promise: event.promise,
        });
      });

      // Network error monitoring
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const startTime = Date.now();
        const url = typeof args[0] === 'string' ? args[0] : args[0].url;
        
        try {
          const response = await originalFetch(...args);
          const duration = Date.now() - startTime;
          
          if (response.ok) {
            this.debug('HTTP request successful', {
              url,
              status: response.status,
              duration,
            });
          } else {
            this.warn('HTTP request failed', {
              url,
              status: response.status,
              statusText: response.statusText,
              duration,
            });
          }
          
          return response;
        } catch (error) {
          const duration = Date.now() - startTime;
          this.error('Network request error', error as Error, {
            url,
            duration,
          });
          throw error;
        }
      };
    }
  }

  private startAutoFlush(): void {
    // Flush logs every 30 seconds
    this.flushInterval = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, 30000);

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  flush(): void {
    if (this.buffer.length === 0) return;

    const logsToSend = [...this.buffer];
    this.buffer = [];

    this.sendToExternalService(logsToSend);
  }

  private async sendToExternalService(logs: LogEntry[]): Promise<void> {
    try {
      // In a real application, you would send to your logging service
      // For now, we'll send to a Supabase edge function
      
      if (import.meta?.env?.MODE === 'development') {
        console.group('📊 Monitoring Logs');
        logs.forEach(log => {
          console.log(`[${log.level}] ${log.message}`, log);
        });
        console.groupEnd();
        return;
      }

      // Send to monitoring endpoint
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs }),
      }).catch(error => {
        console.error('Failed to send logs to monitoring service:', error);
      });

    } catch (error) {
      console.error('Failed to send logs:', error);
    }
  }

  // Analytics tracking
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      eventName,
      properties,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    };

    this.info('Analytics event', event);
    
    // Send to analytics service
    this.sendAnalyticsEvent(event);
  }

  private async sendAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    try {
      if (import.meta?.env?.MODE === 'development') {
        console.log('📈 Analytics Event:', event);
        return;
      }

      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }).catch(error => {
        console.error('Failed to send analytics event:', error);
      });

    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  // Performance tracking
  startTimer(name: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.info('Performance timing', {
        name,
        duration,
        memoryUsage: this.getMemoryUsage(),
      });
      
      if (duration > 1000) { // Log slow operations
        this.warn('Slow operation detected', {
          name,
          duration,
        });
      }
    };
  }

  // Custom metrics
  recordMetric(name: string, value: number, unit?: string): void {
    this.info('Custom metric', {
      metricName: name,
      value,
      unit,
    });
  }

  // User interaction tracking
  trackUserAction(action: string, target?: string, properties?: Record<string, any>): void {
    this.trackEvent('user_action', {
      action,
      target,
      ...properties,
    });
  }

  // Error boundary integration
  reportError(error: Error, errorInfo: any): void {
    this.error('React error boundary', error, {
      componentStack: errorInfo.componentStack,
    });
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Create singleton instance
export const monitoring = new MonitoringService();

// Export types for external use
export type { LogEntry, AnalyticsEvent };

// Utility functions for common use cases
export const logger = {
  debug: monitoring.debug.bind(monitoring),
  info: monitoring.info.bind(monitoring),
  warn: monitoring.warn.bind(monitoring),
  error: monitoring.error.bind(monitoring),
  fatal: monitoring.fatal.bind(monitoring),
};

export const analytics = {
  track: monitoring.trackEvent.bind(monitoring),
  user: monitoring.trackUserAction.bind(monitoring),
};

export const performance = {
  timer: monitoring.startTimer.bind(monitoring),
  metric: monitoring.recordMetric.bind(monitoring),
};