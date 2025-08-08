import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { logger } from '@/lib/logger';

interface ScamDunkDB extends DBSchema {
  analysisResults: {
    key: string;
    value: {
      id: string;
      timestamp: number;
      platform: string;
      groupName: string;
      results: any;
      expiresAt: number;
    };
    indexes: { 'by-timestamp': number; 'by-platform': string };
  };
  userPreferences: {
    key: string;
    value: {
      key: string;
      value: any;
    };
  };
  cachedData: {
    key: string;
    value: {
      key: string;
      data: any;
      timestamp: number;
      ttl: number;
    };
  };
}

class StorageManager {
  private db: IDBPDatabase<ScamDunkDB> | null = null;
  private dbName = 'scam-dunk-storage';
  private version = 1;

  async initialize(): Promise<void> {
    if (this.db) return;

    try {
      this.db = await openDB<ScamDunkDB>(this.dbName, this.version, {
        upgrade(db) {
          // Analysis results store
          if (!db.objectStoreNames.contains('analysisResults')) {
            const resultsStore = db.createObjectStore('analysisResults', {
              keyPath: 'id',
            });
            resultsStore.createIndex('by-timestamp', 'timestamp');
            resultsStore.createIndex('by-platform', 'platform');
          }

          // User preferences store
          if (!db.objectStoreNames.contains('userPreferences')) {
            db.createObjectStore('userPreferences', {
              keyPath: 'key',
            });
          }

          // Cached data store
          if (!db.objectStoreNames.contains('cachedData')) {
            db.createObjectStore('cachedData', {
              keyPath: 'key',
            });
          }
        },
      });

      // Migrate existing localStorage data
      await this.migrateFromLocalStorage();
    } catch (error) {
      logger.error('Failed to initialize IndexedDB:', { error });
      // Fall back to localStorage if IndexedDB fails
      this.db = null;
    }
  }

  private async migrateFromLocalStorage(): Promise<void> {
    try {
      // Migrate analysis results
      const storedResults = localStorage.getItem('analysisResults');
      if (storedResults) {
        const results = JSON.parse(storedResults);
        await this.saveAnalysisResults(results);
        localStorage.removeItem('analysisResults');
      }

      // Migrate other localStorage data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith('supabase.')) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              const parsed = JSON.parse(value);
              await this.setPreference(key, parsed);
            } catch {
              await this.setPreference(key, value);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Migration from localStorage failed:', { error });
    }
  }

  async saveAnalysisResults(results: any): Promise<void> {
    if (!this.db) {
      // Fallback to localStorage
      localStorage.setItem('analysisResults', JSON.stringify(results));
      return;
    }

    try {
      const id = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const record = {
        id,
        timestamp: Date.now(),
        platform: results.platform || 'unknown',
        groupName: results.groupName || 'unknown',
        results,
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      };

      await this.db.put('analysisResults', record);

      // Clean up expired records
      await this.cleanupExpiredResults();
    } catch (error) {
      logger.error('Failed to save analysis results:', { error, resultsId: id });
      // Fallback to localStorage
      localStorage.setItem('analysisResults', JSON.stringify(results));
    }
  }

  async getAnalysisResults(id?: string): Promise<any> {
    if (!this.db) {
      const stored = localStorage.getItem('analysisResults');
      return stored ? JSON.parse(stored) : null;
    }

    try {
      if (id) {
        const result = await this.db.get('analysisResults', id);
        return result?.results || null;
      }

      // Get most recent result
      const tx = this.db.transaction('analysisResults', 'readonly');
      const index = tx.store.index('by-timestamp');
      const results = await index.getAll();
      
      if (results.length > 0) {
        // Sort by timestamp descending and return the most recent
        results.sort((a, b) => b.timestamp - a.timestamp);
        return results[0].results;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get analysis results:', { error, id });
      const stored = localStorage.getItem('analysisResults');
      return stored ? JSON.parse(stored) : null;
    }
  }

  async getAllAnalysisResults(): Promise<any[]> {
    if (!this.db) {
      const stored = localStorage.getItem('analysisResults');
      return stored ? [JSON.parse(stored)] : [];
    }

    try {
      const results = await this.db.getAll('analysisResults');
      return results
        .filter(r => r.expiresAt > Date.now())
        .sort((a, b) => b.timestamp - a.timestamp)
        .map(r => r.results);
    } catch (error) {
      logger.error('Failed to get all analysis results:', { error });
      return [];
    }
  }

  async setPreference(key: string, value: any): Promise<void> {
    if (!this.db) {
      localStorage.setItem(key, JSON.stringify(value));
      return;
    }

    try {
      await this.db.put('userPreferences', { key, value });
    } catch (error) {
      logger.error('Failed to set preference:', { error, key });
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  async getPreference(key: string): Promise<any> {
    if (!this.db) {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    }

    try {
      const result = await this.db.get('userPreferences', key);
      return result?.value || null;
    } catch (error) {
      logger.error('Failed to get preference:', { error, key });
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    }
  }

  async setCachedData(key: string, data: any, ttlMinutes: number = 60): Promise<void> {
    if (!this.db) {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000,
      };
      localStorage.setItem(`cache-${key}`, JSON.stringify(cacheData));
      return;
    }

    try {
      await this.db.put('cachedData', {
        key,
        data,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000,
      });
    } catch (error) {
      logger.error('Failed to set cached data:', { error, key });
    }
  }

  async getCachedData(key: string): Promise<any> {
    if (!this.db) {
      const stored = localStorage.getItem(`cache-${key}`);
      if (stored) {
        const cacheData = JSON.parse(stored);
        if (Date.now() - cacheData.timestamp < cacheData.ttl) {
          return cacheData.data;
        }
        localStorage.removeItem(`cache-${key}`);
      }
      return null;
    }

    try {
      const result = await this.db.get('cachedData', key);
      if (result && Date.now() - result.timestamp < result.ttl) {
        return result.data;
      }
      
      // Clean up expired cache
      if (result) {
        await this.db.delete('cachedData', key);
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get cached data:', { error, key });
      return null;
    }
  }

  private async cleanupExpiredResults(): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction('analysisResults', 'readwrite');
      const results = await tx.store.getAll();
      
      for (const result of results) {
        if (result.expiresAt < Date.now()) {
          await tx.store.delete(result.id);
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup expired results:', { error });
    }
  }

  async clearAll(): Promise<void> {
    if (!this.db) {
      // Clear localStorage except Supabase keys
      const keysToKeep: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('supabase.')) {
          keysToKeep.push(key);
        }
      }
      
      const valuesToKeep: { [key: string]: string | null } = {};
      keysToKeep.forEach(key => {
        valuesToKeep[key] = localStorage.getItem(key);
      });
      
      localStorage.clear();
      
      Object.entries(valuesToKeep).forEach(([key, value]) => {
        if (value) localStorage.setItem(key, value);
      });
      
      return;
    }

    try {
      await this.db.clear('analysisResults');
      await this.db.clear('userPreferences');
      await this.db.clear('cachedData');
    } catch (error) {
      logger.error('Failed to clear storage:', { error });
    }
  }

  async exportData(): Promise<any> {
    const data: any = {
      analysisResults: [],
      preferences: {},
      exportedAt: new Date().toISOString(),
    };

    if (!this.db) {
      // Export from localStorage
      const results = localStorage.getItem('analysisResults');
      if (results) {
        data.analysisResults = [JSON.parse(results)];
      }
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith('supabase.') && key !== 'analysisResults') {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              data.preferences[key] = JSON.parse(value);
            } catch {
              data.preferences[key] = value;
            }
          }
        }
      }
      
      return data;
    }

    try {
      data.analysisResults = await this.getAllAnalysisResults();
      
      const prefs = await this.db.getAll('userPreferences');
      prefs.forEach(pref => {
        data.preferences[pref.key] = pref.value;
      });
      
      return data;
    } catch (error) {
      logger.error('Failed to export data:', { error });
      return data;
    }
  }
}

// Create singleton instance
const storageManager = new StorageManager();

// Initialize on first import
if (typeof window !== 'undefined') {
  storageManager.initialize();
}

export default storageManager;