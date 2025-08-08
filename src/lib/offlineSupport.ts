// Offline support utilities for PWA functionality
import { logger } from './logger';
import { localCache, sessionCache } from './cache';
import { AnalysisResult } from '../services/types';

export interface OfflineQueueItem {
  id: string;
  type: 'analysis' | 'check' | 'export';
  data: any;
  timestamp: Date;
  retries: number;
  maxRetries: number;
}

export interface NetworkStatus {
  online: boolean;
  type?: string;
  downlink?: number;
  rtt?: number;
}

class OfflineSupport {
  private queue: OfflineQueueItem[] = [];
  private networkStatus: NetworkStatus = { online: navigator.onLine };
  private retryTimeout?: NodeJS.Timeout;
  private readonly maxRetries = 3;
  private readonly retryDelay = 5000; // 5 seconds

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Set up network status listeners
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Enhanced network monitoring if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        this.updateNetworkStatus();
        connection.addEventListener('change', this.updateNetworkStatus.bind(this));
      }
    }

    // Load queued items from storage
    this.loadQueue();

    // Process queue if online
    if (this.networkStatus.online) {
      this.processQueue();
    }

    logger.info('Offline support initialized', { 
      online: this.networkStatus.online,
      queueLength: this.queue.length
    });
  }

  private handleOnline(): void {
    this.networkStatus.online = true;
    this.updateNetworkStatus();
    
    logger.info('Network connection restored');
    
    // Show notification
    this.showNetworkNotification('🟢 Back Online', 'Connection restored. Processing queued actions...');
    
    // Process queued items
    this.processQueue();
  }

  private handleOffline(): void {
    this.networkStatus.online = false;
    this.updateNetworkStatus();
    
    logger.warn('Network connection lost');
    
    // Show notification
    this.showNetworkNotification('🔴 Offline', 'You\'re offline. Actions will be queued until connection is restored.');
  }

  private updateNetworkStatus(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        this.networkStatus = {
          online: navigator.onLine,
          type: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        };
      }
    } else {
      this.networkStatus = { online: navigator.onLine };
    }
  }

  // Queue an action for later processing
  async queueAction(type: OfflineQueueItem['type'], data: any): Promise<string> {
    const item: OfflineQueueItem = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date(),
      retries: 0,
      maxRetries: this.maxRetries
    };

    this.queue.push(item);
    await this.saveQueue();

    logger.info('Action queued for offline processing', {
      id: item.id,
      type: item.type,
      queueLength: this.queue.length
    });

    return item.id;
  }

  // Process the offline queue
  private async processQueue(): Promise<void> {
    if (!this.networkStatus.online || this.queue.length === 0) {
      return;
    }

    logger.info('Processing offline queue', { queueLength: this.queue.length });

    const itemsToProcess = [...this.queue];
    
    for (const item of itemsToProcess) {
      try {
        await this.processQueueItem(item);
        
        // Remove from queue on success
        this.queue = this.queue.filter(q => q.id !== item.id);
        
      } catch (error) {
        logger.error('Failed to process queue item', {
          error,
          itemId: item.id,
          retries: item.retries
        });

        // Increment retry count
        const queueItem = this.queue.find(q => q.id === item.id);
        if (queueItem) {
          queueItem.retries++;
          
          if (queueItem.retries >= queueItem.maxRetries) {
            // Remove item after max retries
            this.queue = this.queue.filter(q => q.id !== item.id);
            this.showNetworkNotification('❌ Action Failed', `Failed to process ${item.type} after ${item.maxRetries} attempts.`);
          }
        }
      }
    }

    await this.saveQueue();

    // Schedule next processing if there are still items
    if (this.queue.length > 0 && this.networkStatus.online) {
      this.scheduleRetry();
    }
  }

  private async processQueueItem(item: OfflineQueueItem): Promise<void> {
    switch (item.type) {
      case 'analysis':
        await this.processAnalysisItem(item);
        break;
      case 'check':
        await this.processCheckItem(item);
        break;
      case 'export':
        await this.processExportItem(item);
        break;
      default:
        throw new Error(`Unknown queue item type: ${item.type}`);
    }
  }

  private async processAnalysisItem(item: OfflineQueueItem): Promise<void> {
    const { riskAnalysisService } = await import('../services/riskAnalysisService');
    const result = await riskAnalysisService.analyzeGroup(item.data);
    
    // Store result
    await localCache.set(`analysis_${result.analysisId}`, result, 24 * 60 * 60 * 1000);
    
    this.showNetworkNotification('✅ Analysis Complete', 'Your queued analysis has been processed.');
  }

  private async processCheckItem(item: OfflineQueueItem): Promise<void> {
    const { riskAnalysisService } = await import('../services/riskAnalysisService');
    const result = await riskAnalysisService.performSingleCheck(item.data.type, item.data.input);
    
    // Store result
    await sessionCache.set('single_check_result', {
      type: item.data.type,
      result,
      timestamp: new Date().toISOString()
    });
    
    this.showNetworkNotification('✅ Check Complete', 'Your queued security check has been processed.');
  }

  private async processExportItem(item: OfflineQueueItem): Promise<void> {
    const { exportService } = await import('./exportService');
    await exportService.exportAnalysisResults(item.data.results, item.data.options);
    
    this.showNetworkNotification('✅ Export Ready', 'Your queued export has been generated.');
  }

  private scheduleRetry(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.retryTimeout = setTimeout(() => {
      this.processQueue();
    }, this.retryDelay);
  }

  // Save queue to persistent storage
  private async saveQueue(): Promise<void> {
    try {
      await localCache.set('offline_queue', this.queue, 7 * 24 * 60 * 60 * 1000); // 7 days
    } catch (error) {
      logger.error('Failed to save offline queue', { error });
    }
  }

  // Load queue from persistent storage
  private async loadQueue(): Promise<void> {
    try {
      const savedQueue = await localCache.get<OfflineQueueItem[]>('offline_queue');
      if (savedQueue && Array.isArray(savedQueue)) {
        // Filter out expired items (older than 24 hours)
        const now = Date.now();
        this.queue = savedQueue.filter(item => {
          const itemAge = now - new Date(item.timestamp).getTime();
          return itemAge < 24 * 60 * 60 * 1000; // 24 hours
        });
      }
    } catch (error) {
      logger.error('Failed to load offline queue', { error });
      this.queue = [];
    }
  }

  private showNetworkNotification(title: string, message: string): void {
    // Create a simple notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  }

  // Public methods
  getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getQueueItems(): OfflineQueueItem[] {
    return [...this.queue];
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }

  // Check if device can handle offline functionality
  supportsOffline(): boolean {
    return 'serviceWorker' in navigator && 'caches' in window;
  }

  // Cache critical resources for offline use
  async cacheEssentialResources(): Promise<void> {
    if (!this.supportsOffline()) {
      logger.warn('Offline functionality not supported');
      return;
    }

    try {
      const cache = await caches.open('scamshield-essential-v1');
      
      const essentialResources = [
        '/',
        '/manifest.json',
        '/favicon.ico',
        // Add critical CSS and JS files that would be needed offline
      ];

      await cache.addAll(essentialResources);
      logger.info('Essential resources cached for offline use');
    } catch (error) {
      logger.error('Failed to cache essential resources', { error });
    }
  }

  // Get cached analysis results for offline viewing
  async getCachedAnalyses(): Promise<AnalysisResult[]> {
    try {
      // This would need to be implemented based on your cache structure
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error('Failed to get cached analyses', { error });
      return [];
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
}

// Export singleton instance
export const offlineSupport = new OfflineSupport();

// Export types and interfaces
export type { OfflineQueueItem, NetworkStatus };