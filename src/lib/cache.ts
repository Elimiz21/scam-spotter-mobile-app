// Comprehensive caching strategy with multiple storage backends
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { logger } from './logger';

// Cache storage types
export enum CacheStorage {
  MEMORY = 'memory',
  SESSION = 'session',
  LOCAL = 'local',
  INDEXED_DB = 'indexedDB',
}

// Cache entry interface
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  expiry: number;
  metadata?: {
    createdAt: number;
    accessCount: number;
    lastAccessed: number;
    size?: number;
  };
}

// Cache options
export interface CacheOptions {
  storage?: CacheStorage;
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Max cache size in bytes
  maxEntries?: number; // Max number of entries
  compress?: boolean; // Compress data before storing
  encrypt?: boolean; // Encrypt sensitive data
}

// IndexedDB schema
interface CacheDB extends DBSchema {
  cache: {
    key: string;
    value: CacheEntry;
    indexes: {
      'by-expiry': number;
      'by-accessed': number;
    };
  };
}

// Abstract cache interface
export abstract class CacheProvider {
  abstract get<T>(key: string): Promise<T | null>;
  abstract set<T>(key: string, value: T, ttl?: number): Promise<void>;
  abstract delete(key: string): Promise<void>;
  abstract clear(): Promise<void>;
  abstract has(key: string): Promise<boolean>;
  abstract size(): Promise<number>;
  abstract keys(): Promise<string[]>;
}

// Memory cache implementation
export class MemoryCache extends CacheProvider {
  private cache = new Map<string, CacheEntry>();
  private maxEntries: number;
  private maxSize: number;
  private currentSize = 0;

  constructor(options: CacheOptions = {}) {
    super();
    this.maxEntries = options.maxEntries || 1000;
    this.maxSize = options.maxSize || 50 * 1024 * 1024; // 50MB default
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expiry) {
      await this.delete(key);
      return null;
    }
    
    // Update access metadata
    if (entry.metadata) {
      entry.metadata.accessCount++;
      entry.metadata.lastAccessed = Date.now();
    }
    
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl: number = 3600000): Promise<void> {
    const size = this.estimateSize(value);
    
    // Check if we need to evict entries
    if (this.cache.size >= this.maxEntries || this.currentSize + size > this.maxSize) {
      await this.evictLRU();
    }
    
    const entry: CacheEntry<T> = {
      key,
      value,
      expiry: Date.now() + ttl,
      metadata: {
        createdAt: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now(),
        size,
      },
    };
    
    this.cache.set(key, entry);
    this.currentSize += size;
  }

  async delete(key: string): Promise<void> {
    const entry = this.cache.get(key);
    
    if (entry && entry.metadata?.size) {
      this.currentSize -= entry.metadata.size;
    }
    
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.currentSize = 0;
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    if (Date.now() > entry.expiry) {
      await this.delete(key);
      return false;
    }
    
    return true;
  }

  async size(): Promise<number> {
    return this.cache.size;
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  private estimateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate in bytes
    } catch {
      return 1024; // Default 1KB if serialization fails
    }
  }

  private async evictLRU(): Promise<void> {
    // Sort by last accessed time and remove oldest
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => {
        const aTime = a[1].metadata?.lastAccessed || 0;
        const bTime = b[1].metadata?.lastAccessed || 0;
        return aTime - bTime;
      });
    
    // Remove 10% of entries
    const toRemove = Math.ceil(entries.length * 0.1);
    
    for (let i = 0; i < toRemove; i++) {
      if (entries[i]) {
        await this.delete(entries[i][0]);
      }
    }
  }
}

// LocalStorage/SessionStorage cache implementation
export class StorageCache extends CacheProvider {
  private storage: Storage;
  private prefix = 'cache_';

  constructor(options: CacheOptions = {}) {
    super();
    this.storage = options.storage === CacheStorage.SESSION 
      ? sessionStorage 
      : localStorage;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = this.storage.getItem(this.prefix + key);
      
      if (!item) {
        return null;
      }
      
      const entry: CacheEntry<T> = JSON.parse(item);
      
      if (Date.now() > entry.expiry) {
        await this.delete(key);
        return null;
      }
      
      return entry.value;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = 3600000): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        key,
        value,
        expiry: Date.now() + ttl,
      };
      
      this.storage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      // Storage quota exceeded or serialization error
      logger.error('Cache set error', { key, error });
      
      // Try to clear some space
      await this.evictOldest();
      
      // Retry once
      try {
        const entry: CacheEntry<T> = {
          key,
          value,
          expiry: Date.now() + ttl,
        };
        
        this.storage.setItem(this.prefix + key, JSON.stringify(entry));
      } catch {
        // Give up
      }
    }
  }

  async delete(key: string): Promise<void> {
    this.storage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    const keys = await this.keys();
    
    for (const key of keys) {
      this.storage.removeItem(this.prefix + key);
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async size(): Promise<number> {
    return (await this.keys()).length;
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];
    
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    
    return keys;
  }

  private async evictOldest(): Promise<void> {
    const entries: Array<[string, CacheEntry]> = [];
    
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      
      if (key && key.startsWith(this.prefix)) {
        try {
          const item = this.storage.getItem(key);
          
          if (item) {
            entries.push([key, JSON.parse(item)]);
          }
        } catch {
          // Invalid entry, remove it
          this.storage.removeItem(key);
        }
      }
    }
    
    // Sort by expiry and remove oldest 25%
    entries.sort((a, b) => a[1].expiry - b[1].expiry);
    const toRemove = Math.ceil(entries.length * 0.25);
    
    for (let i = 0; i < toRemove; i++) {
      if (entries[i]) {
        this.storage.removeItem(entries[i][0]);
      }
    }
  }
}

// IndexedDB cache implementation
export class IndexedDBCache extends CacheProvider {
  private db: IDBPDatabase<CacheDB> | null = null;
  private dbName = 'ScamShieldCache';
  private version = 1;

  async init(): Promise<void> {
    if (this.db) return;
    
    try {
      this.db = await openDB<CacheDB>(this.dbName, this.version, {
        upgrade(db) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('by-expiry', 'expiry');
          store.createIndex('by-accessed', 'metadata.lastAccessed');
        },
      });
    } catch (error) {
      logger.error('IndexedDB init error', { error });
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    await this.init();
    
    if (!this.db) return null;
    
    try {
      const entry = await this.db.get('cache', key);
      
      if (!entry) {
        return null;
      }
      
      if (Date.now() > entry.expiry) {
        await this.delete(key);
        return null;
      }
      
      // Update access metadata
      if (entry.metadata) {
        entry.metadata.accessCount++;
        entry.metadata.lastAccessed = Date.now();
        await this.db.put('cache', entry);
      }
      
      return entry.value as T;
    } catch (error) {
      logger.error('IndexedDB get error', { key, error });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = 3600000): Promise<void> {
    await this.init();
    
    if (!this.db) return;
    
    try {
      const entry: CacheEntry<T> = {
        key,
        value,
        expiry: Date.now() + ttl,
        metadata: {
          createdAt: Date.now(),
          accessCount: 0,
          lastAccessed: Date.now(),
        },
      };
      
      await this.db.put('cache', entry);
    } catch (error) {
      logger.error('IndexedDB set error', { key, error });
    }
  }

  async delete(key: string): Promise<void> {
    await this.init();
    
    if (!this.db) return;
    
    try {
      await this.db.delete('cache', key);
    } catch (error) {
      logger.error('IndexedDB delete error', { key, error });
    }
  }

  async clear(): Promise<void> {
    await this.init();
    
    if (!this.db) return;
    
    try {
      await this.db.clear('cache');
    } catch (error) {
      logger.error('IndexedDB clear error', { error });
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async size(): Promise<number> {
    await this.init();
    
    if (!this.db) return 0;
    
    try {
      return await this.db.count('cache');
    } catch (error) {
      logger.error('IndexedDB count error', { error });
      return 0;
    }
  }

  async keys(): Promise<string[]> {
    await this.init();
    
    if (!this.db) return [];
    
    try {
      return await this.db.getAllKeys('cache');
    } catch (error) {
      logger.error('IndexedDB keys error', { error });
      return [];
    }
  }

  async cleanup(): Promise<void> {
    await this.init();
    
    if (!this.db) return;
    
    try {
      const tx = this.db.transaction('cache', 'readwrite');
      const index = tx.store.index('by-expiry');
      const now = Date.now();
      
      // Get all expired entries
      const range = IDBKeyRange.upperBound(now);
      let cursor = await index.openCursor(range);
      
      while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
      }
      
      await tx.done;
    } catch (error) {
      logger.error('IndexedDB cleanup error', { error });
    }
  }
}

// Multi-tier cache implementation
export class MultiTierCache extends CacheProvider {
  private tiers: CacheProvider[] = [];

  constructor(tiers: CacheProvider[]) {
    super();
    this.tiers = tiers;
  }

  async get<T>(key: string): Promise<T | null> {
    for (let i = 0; i < this.tiers.length; i++) {
      const value = await this.tiers[i].get<T>(key);
      
      if (value !== null) {
        // Promote to higher tiers
        for (let j = 0; j < i; j++) {
          await this.tiers[j].set(key, value);
        }
        
        return value;
      }
    }
    
    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Set in all tiers
    await Promise.all(
      this.tiers.map(tier => tier.set(key, value, ttl))
    );
  }

  async delete(key: string): Promise<void> {
    // Delete from all tiers
    await Promise.all(
      this.tiers.map(tier => tier.delete(key))
    );
  }

  async clear(): Promise<void> {
    // Clear all tiers
    await Promise.all(
      this.tiers.map(tier => tier.clear())
    );
  }

  async has(key: string): Promise<boolean> {
    for (const tier of this.tiers) {
      if (await tier.has(key)) {
        return true;
      }
    }
    
    return false;
  }

  async size(): Promise<number> {
    // Return size of first tier (memory)
    return this.tiers[0]?.size() || 0;
  }

  async keys(): Promise<string[]> {
    // Get unique keys from all tiers
    const allKeys = new Set<string>();
    
    for (const tier of this.tiers) {
      const keys = await tier.keys();
      keys.forEach(key => allKeys.add(key));
    }
    
    return Array.from(allKeys);
  }
}

// Cache factory
export class CacheFactory {
  static create(options: CacheOptions = {}): CacheProvider {
    const storage = options.storage || CacheStorage.MEMORY;
    
    switch (storage) {
      case CacheStorage.MEMORY:
        return new MemoryCache(options);
      
      case CacheStorage.SESSION:
      case CacheStorage.LOCAL:
        return new StorageCache(options);
      
      case CacheStorage.INDEXED_DB:
        return new IndexedDBCache();
      
      default:
        return new MemoryCache(options);
    }
  }
  
  static createMultiTier(): CacheProvider {
    return new MultiTierCache([
      new MemoryCache({ maxEntries: 100 }),
      new StorageCache({ storage: CacheStorage.SESSION }),
      new IndexedDBCache(),
    ]);
  }
}

// Global cache instances
export const memoryCache = new MemoryCache();
export const sessionCache = new StorageCache({ storage: CacheStorage.SESSION });
export const localCache = new StorageCache({ storage: CacheStorage.LOCAL });
export const indexedDBCache = new IndexedDBCache();
export const multiTierCache = CacheFactory.createMultiTier();

// Cache decorator for methods
export function Cacheable(options: {
  key?: string | ((...args: any[]) => string);
  ttl?: number;
  storage?: CacheStorage;
} = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cache = CacheFactory.create({ storage: options.storage });
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = typeof options.key === 'function'
        ? options.key(...args)
        : options.key || `${target.constructor.name}_${propertyKey}_${JSON.stringify(args)}`;
      
      // Try to get from cache
      const cached = await cache.get(cacheKey);
      
      if (cached !== null) {
        return cached;
      }
      
      // Execute method
      const result = await originalMethod.apply(this, args);
      
      // Store in cache
      await cache.set(cacheKey, result, options.ttl);
      
      return result;
    };
    
    return descriptor;
  };
}