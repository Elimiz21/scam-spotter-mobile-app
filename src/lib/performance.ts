// Core Web Vitals and Performance Optimization Library
import { logger } from './logger';

// Core Web Vitals Types
export interface WebVitalsMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay  
  cls: number | null; // Cumulative Layout Shift
  
  // Additional Performance Metrics
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  inp: number | null; // Interaction to Next Paint (replacing FID)
  
  // Custom Metrics
  domContentLoaded: number | null;
  windowLoaded: number | null;
  navigationStart: number | null;
}

export interface PerformanceConfig {
  enableReporting: boolean;
  reportingEndpoint?: string;
  sampleRate: number; // 0-1
  thresholds: {
    lcp: { good: number; needsImprovement: number };
    fid: { good: number; needsImprovement: number };
    cls: { good: number; needsImprovement: number };
    fcp: { good: number; needsImprovement: number };
    ttfb: { good: number; needsImprovement: number };
  };
}

export interface PerformanceReport {
  metrics: WebVitalsMetrics;
  deviceInfo: DeviceInfo;
  connectionInfo: ConnectionInfo;
  pageInfo: PageInfo;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

export interface DeviceInfo {
  userAgent: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  viewport: {
    width: number;
    height: number;
  };
}

export interface ConnectionInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export interface PageInfo {
  url: string;
  pathname: string;
  referrer: string;
  title: string;
  loadType: 'navigation' | 'reload' | 'back_forward';
}

export interface ResourceTiming {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
  initiatorType?: string;
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enableReporting: true,
  sampleRate: 0.1, // 10% sampling
  thresholds: {
    lcp: { good: 2500, needsImprovement: 4000 },
    fid: { good: 100, needsImprovement: 300 },
    cls: { good: 0.1, needsImprovement: 0.25 },
    fcp: { good: 1800, needsImprovement: 3000 },
    ttfb: { good: 800, needsImprovement: 1800 }
  }
};

export class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: WebVitalsMetrics = {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    inp: null,
    domContentLoaded: null,
    windowLoaded: null,
    navigationStart: null
  };
  private sessionId: string;
  private observers: Map<string, PerformanceObserver>;
  private isReportingSent = false;

  constructor(config: Partial<PerformanceConfig> = {}) {
    // Initialize Map in constructor to avoid module-level execution
    this.observers = new Map();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    
    if (this.shouldSample()) {
      this.initializeMonitoring();
    }
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  private generateSessionId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMonitoring() {
    // Initialize Core Web Vitals monitoring
    this.initializeLCP();
    this.initializeFID();
    this.initializeCLS();
    this.initializeFCP();
    this.initializeTTFB();
    this.initializeINP();
    
    // Initialize additional metrics
    this.initializeNavigationTiming();
    this.initializeResourceTiming();
    
    // Schedule reporting
    this.scheduleReporting();
    
    logger.info('Performance monitoring initialized', { sessionId: this.sessionId });
  }

  private initializeLCP() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        this.metrics.lcp = lastEntry.startTime;
        this.logMetric('LCP', lastEntry.startTime);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', observer);
    } catch (error) {
      logger.warn('Failed to initialize LCP observer:', error);
    }
  }

  private initializeFID() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
          this.logMetric('FID', this.metrics.fid);
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', observer);
    } catch (error) {
      logger.warn('Failed to initialize FID observer:', error);
    }
  }

  private initializeCLS() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      let clsValue = 0;
      let clsEntries: any[] = [];
      let sessionValue = 0;
      let sessionEntries: any[] = [];
      
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];
            
            if (sessionValue &&
                entry.startTime - lastSessionEntry.startTime < 1000 &&
                entry.startTime - firstSessionEntry.startTime < 5000) {
              sessionValue += entry.value;
              sessionEntries.push(entry);
            } else {
              sessionValue = entry.value;
              sessionEntries = [entry];
            }
            
            if (sessionValue > clsValue) {
              clsValue = sessionValue;
              clsEntries = [...sessionEntries];
              
              this.metrics.cls = clsValue;
              this.logMetric('CLS', clsValue);
            }
          }
        });
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', observer);
    } catch (error) {
      logger.warn('Failed to initialize CLS observer:', error);
    }
  }

  private initializeFCP() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
            this.logMetric('FCP', entry.startTime);
          }
        });
      });
      
      observer.observe({ entryTypes: ['paint'] });
      this.observers.set('fcp', observer);
    } catch (error) {
      logger.warn('Failed to initialize FCP observer:', error);
    }
  }

  private initializeTTFB() {
    if (performance.timing) {
      // Use Navigation Timing API
      const ttfb = performance.timing.responseStart - performance.timing.navigationStart;
      this.metrics.ttfb = ttfb;
      this.logMetric('TTFB', ttfb);
    } else if ('PerformanceObserver' in window) {
      // Use Performance Observer for Navigation Timing Level 2
      try {
        const observer = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            if (entry.entryType === 'navigation') {
              const ttfb = entry.responseStart - entry.startTime;
              this.metrics.ttfb = ttfb;
              this.logMetric('TTFB', ttfb);
            }
          });
        });
        
        observer.observe({ entryTypes: ['navigation'] });
        this.observers.set('ttfb', observer);
      } catch (error) {
        logger.warn('Failed to initialize TTFB observer:', error);
      }
    }
  }

  private initializeINP() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      let interactions: any[] = [];
      
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          interactions.push(entry);
          
          // Calculate INP as the 98th percentile of interactions
          const sortedInteractions = interactions
            .map(e => e.processingStart - e.startTime)
            .sort((a, b) => a - b);
          
          const p98Index = Math.floor(sortedInteractions.length * 0.98);
          this.metrics.inp = sortedInteractions[p98Index] || null;
        });
      });
      
      observer.observe({ entryTypes: ['event'] });
      this.observers.set('inp', observer);
    } catch (error) {
      logger.warn('Failed to initialize INP observer:', error);
    }
  }

  private initializeNavigationTiming() {
    const loadHandler = () => {
      if (performance.timing) {
        this.metrics.domContentLoaded = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
        this.metrics.windowLoaded = performance.timing.loadEventEnd - performance.timing.navigationStart;
        this.metrics.navigationStart = performance.timing.navigationStart;
      }
    };

    if (document.readyState === 'complete') {
      loadHandler();
    } else {
      window.addEventListener('load', loadHandler, { once: true });
    }
  }

  private initializeResourceTiming() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        
        // Log large resources that might impact performance
        entries.forEach((entry: any) => {
          if (entry.transferSize && entry.transferSize > 1024 * 1024) { // > 1MB
            logger.warn('Large resource detected', {
              name: entry.name,
              size: entry.transferSize,
              duration: entry.duration
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', observer);
    } catch (error) {
      logger.warn('Failed to initialize resource timing observer:', error);
    }
  }

  private scheduleReporting() {
    // Report on page visibility change (tab switch, etc.)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && !this.isReportingSent) {
        this.sendReport();
      }
    });

    // Report on page unload
    window.addEventListener('beforeunload', () => {
      if (!this.isReportingSent) {
        this.sendReport();
      }
    });

    // Report after 30 seconds for long sessions
    setTimeout(() => {
      if (!this.isReportingSent) {
        this.sendReport();
      }
    }, 30000);
  }

  private logMetric(name: string, value: number | null) {
    if (value === null) return;
    
    const thresholds = this.config.thresholds[name.toLowerCase() as keyof typeof this.config.thresholds];
    if (!thresholds) return;
    
    let rating: 'good' | 'needs-improvement' | 'poor';
    if (value <= thresholds.good) {
      rating = 'good';
    } else if (value <= thresholds.needsImprovement) {
      rating = 'needs-improvement';
    } else {
      rating = 'poor';
    }
    
    logger.info(`${name} metric collected`, {
      value: Math.round(value),
      rating,
      sessionId: this.sessionId
    });
  }

  private collectDeviceInfo(): DeviceInfo {
    const nav = navigator as any;
    
    return {
      userAgent: navigator.userAgent,
      deviceMemory: nav.deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      platform: navigator.platform,
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  private collectConnectionInfo(): ConnectionInfo {
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (!conn) return {};
    
    return {
      effectiveType: conn.effectiveType,
      downlink: conn.downlink,
      rtt: conn.rtt,
      saveData: conn.saveData
    };
  }

  private collectPageInfo(): PageInfo {
    const navigation = performance.getEntriesByType('navigation')[0] as any;
    
    return {
      url: window.location.href,
      pathname: window.location.pathname,
      referrer: document.referrer,
      title: document.title,
      loadType: navigation?.type || 'navigation'
    };
  }

  private async sendReport() {
    if (this.isReportingSent || !this.config.enableReporting) return;
    
    this.isReportingSent = true;
    
    const report: PerformanceReport = {
      metrics: { ...this.metrics },
      deviceInfo: this.collectDeviceInfo(),
      connectionInfo: this.collectConnectionInfo(),
      pageInfo: this.collectPageInfo(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.getUserId()
    };
    
    try {
      if (this.config.reportingEndpoint) {
        // Send to analytics endpoint
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            this.config.reportingEndpoint,
            JSON.stringify(report)
          );
        } else {
          fetch(this.config.reportingEndpoint, {
            method: 'POST',
            body: JSON.stringify(report),
            headers: {
              'Content-Type': 'application/json'
            },
            keepalive: true
          }).catch(error => {
            logger.warn('Failed to send performance report:', error);
          });
        }
      }
      
      // Log locally for debugging
      logger.info('Performance report generated', {
        sessionId: this.sessionId,
        metrics: report.metrics,
        url: report.pageInfo.url
      });
      
    } catch (error) {
      logger.error('Failed to send performance report:', error);
    }
  }

  private getUserId(): string | undefined {
    // Try to get user ID from various sources
    const userId = localStorage.getItem('userId') || 
                  sessionStorage.getItem('userId') ||
                  (window as any).userId;
    
    return userId || undefined;
  }

  // Public API methods
  getMetrics(): WebVitalsMetrics {
    return { ...this.metrics };
  }

  getSessionId(): string {
    return this.sessionId;
  }

  // Manual metric collection
  markCustomMetric(name: string, startTime?: number) {
    const time = startTime || performance.now();
    performance.mark(name);
    
    logger.debug('Custom metric marked', { name, time });
  }

  measureCustomMetric(name: string, startMark: string, endMark?: string) {
    try {
      const measureName = `measure-${name}`;
      performance.measure(measureName, startMark, endMark);
      
      const measure = performance.getEntriesByName(measureName)[0];
      logger.info('Custom metric measured', {
        name,
        duration: measure.duration
      });
      
      return measure.duration;
    } catch (error) {
      logger.warn('Failed to measure custom metric:', error);
      return null;
    }
  }

  // Resource timing analysis
  getResourceTimings(): ResourceTiming[] {
    return performance.getEntriesByType('resource').map(entry => ({
      name: entry.name,
      entryType: entry.entryType,
      startTime: entry.startTime,
      duration: entry.duration,
      transferSize: (entry as any).transferSize,
      encodedBodySize: (entry as any).encodedBodySize,
      decodedBodySize: (entry as any).decodedBodySize,
      initiatorType: (entry as any).initiatorType
    }));
  }

  // Performance recommendations
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.lcp && this.metrics.lcp > this.config.thresholds.lcp.needsImprovement) {
      recommendations.push('Optimize Largest Contentful Paint by reducing server response times and optimizing critical resources');
    }
    
    if (this.metrics.fid && this.metrics.fid > this.config.thresholds.fid.needsImprovement) {
      recommendations.push('Reduce First Input Delay by minimizing JavaScript execution and using web workers for heavy computations');
    }
    
    if (this.metrics.cls && this.metrics.cls > this.config.thresholds.cls.needsImprovement) {
      recommendations.push('Improve Cumulative Layout Shift by setting explicit dimensions for images and ads');
    }
    
    if (this.metrics.ttfb && this.metrics.ttfb > this.config.thresholds.ttfb.needsImprovement) {
      recommendations.push('Reduce Time to First Byte by optimizing server performance and using CDN');
    }
    
    return recommendations;
  }

  // Cleanup
  cleanup() {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
    
    if (!this.isReportingSent) {
      this.sendReport();
    }
  }
}

// Performance optimization utilities
export class PerformanceOptimizer {
  
  // Image lazy loading
  static setupLazyImages() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }
  
  // Preload critical resources
  static preloadResources(resources: Array<{ href: string; as: string; type?: string }>) {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.type) {
        link.type = resource.type;
      }
      document.head.appendChild(link);
    });
  }
  
  // Prefetch resources
  static prefetchResources(urls: string[]) {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }
  
  // Service worker registration for caching
  static async registerServiceWorker(swUrl: string = '/service-worker.js') {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(swUrl);
        logger.info('Service worker registered:', registration);
        return registration;
      } catch (error) {
        logger.error('Service worker registration failed:', error);
      }
    }
    return null;
  }
  
  // Critical CSS inlining
  static inlineCriticalCSS(css: string) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Initialize performance monitoring when module loads
if (typeof window !== 'undefined') {
  // Setup lazy images
  PerformanceOptimizer.setupLazyImages();
  
  // Preload critical resources
  PerformanceOptimizer.preloadResources([
    { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2' },
    { href: '/images/hero-bg.webp', as: 'image' }
  ]);
}

export default performanceMonitor;