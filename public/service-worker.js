// ScamShield Service Worker - Offline functionality and caching
const CACHE_NAME = 'scamshield-v1.0.0';
const RUNTIME_CACHE = 'scamshield-runtime';
const API_CACHE = 'scamshield-api';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html',
  '/assets/scamshield-logo.png',
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/pricing',
  '/api/features',
  '/api/public-stats',
];

// Network-first routes (always try network first)
const NETWORK_FIRST_ROUTES = [
  '/api/auth',
  '/api/payments',
  '/api/real-time',
];

// Cache-first routes (use cache if available)
const CACHE_FIRST_ROUTES = [
  '/assets/',
  '/icons/',
  '/fonts/',
  '/images/',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== RUNTIME_CACHE && 
              cacheName !== API_CACHE) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP(S) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip cross-origin requests (except CDN)
  if (url.origin !== self.location.origin && 
      !url.origin.includes('cdn.scamshield.com')) {
    return;
  }

  // Determine caching strategy based on route
  if (isNetworkFirstRoute(url.pathname)) {
    event.respondWith(networkFirst(request));
  } else if (isCacheFirstRoute(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else if (isApiEndpoint(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    event.respondWith(networkFirstWithOfflineFallback(request));
  }
});

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fall back to cache if network fails
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline fallback for images
    if (request.destination === 'image') {
      return caches.match('/assets/placeholder.png');
    }
    
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    // Update cache with fresh response
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  // Return cached response immediately, or wait for network
  return cachedResponse || fetchPromise;
}

// Network-first with offline fallback
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Offline fallback for navigation
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    // Return error response
    return new Response('Offline - Resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain',
      }),
    });
  }
}

// Helper functions
function isNetworkFirstRoute(pathname) {
  return NETWORK_FIRST_ROUTES.some(route => pathname.includes(route));
}

function isCacheFirstRoute(pathname) {
  return CACHE_FIRST_ROUTES.some(route => pathname.includes(route));
}

function isApiEndpoint(pathname) {
  return pathname.startsWith('/api/') || 
         API_ENDPOINTS.includes(pathname);
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Sync event:', event.tag);
  
  if (event.tag === 'sync-scans') {
    event.waitUntil(syncOfflineScans());
  } else if (event.tag === 'sync-analytics') {
    event.waitUntil(syncAnalytics());
  }
});

// Sync offline scans when connection restored
async function syncOfflineScans() {
  try {
    // Get offline scans from IndexedDB
    const db = await openDB();
    const tx = db.transaction('offline_scans', 'readonly');
    const store = tx.objectStore('offline_scans');
    const scans = await store.getAll();
    
    // Send each scan to server
    for (const scan of scans) {
      await fetch('/api/scans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scan),
      });
      
      // Remove from offline store
      const deleteTx = db.transaction('offline_scans', 'readwrite');
      const deleteStore = deleteTx.objectStore('offline_scans');
      await deleteStore.delete(scan.id);
    }
    
    console.log('[ServiceWorker] Synced offline scans:', scans.length);
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
  }
}

// Sync analytics data
async function syncAnalytics() {
  try {
    const db = await openDB();
    const tx = db.transaction('analytics', 'readonly');
    const store = tx.objectStore('analytics');
    const events = await store.getAll();
    
    if (events.length > 0) {
      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });
      
      // Clear synced events
      const clearTx = db.transaction('analytics', 'readwrite');
      const clearStore = clearTx.objectStore('analytics');
      await clearStore.clear();
    }
    
    console.log('[ServiceWorker] Synced analytics:', events.length);
  } catch (error) {
    console.error('[ServiceWorker] Analytics sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');
  
  let data = {
    title: 'ScamShield Alert',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
  };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss.png',
      },
    ],
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || 'default',
    renotify: data.renotify || false,
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if not
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Periodic background sync (for premium users)
self.addEventListener('periodicsync', (event) => {
  console.log('[ServiceWorker] Periodic sync:', event.tag);
  
  if (event.tag === 'check-scams') {
    event.waitUntil(checkForNewScams());
  } else if (event.tag === 'update-data') {
    event.waitUntil(updateOfflineData());
  }
});

// Check for new scams periodically
async function checkForNewScams() {
  try {
    const response = await fetch('/api/scams/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (data.newScams > 0) {
      // Show notification
      await self.registration.showNotification('New Scams Detected', {
        body: `${data.newScams} new potential scams found`,
        icon: '/icons/alert.png',
        badge: '/icons/badge.png',
        tag: 'scam-alert',
        requireInteraction: true,
      });
    }
  } catch (error) {
    console.error('[ServiceWorker] Scam check failed:', error);
  }
}

// Update offline data
async function updateOfflineData() {
  try {
    // Update cached API responses
    const cache = await caches.open(API_CACHE);
    
    for (const endpoint of API_ENDPOINTS) {
      const response = await fetch(endpoint);
      if (response.ok) {
        await cache.put(endpoint, response);
      }
    }
    
    console.log('[ServiceWorker] Offline data updated');
  } catch (error) {
    console.error('[ServiceWorker] Data update failed:', error);
  }
}

// Message handler for client communication
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  } else if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(cacheUrls(event.data.urls));
  }
});

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[ServiceWorker] All caches cleared');
}

// Cache specific URLs
async function cacheUrls(urls) {
  const cache = await caches.open(RUNTIME_CACHE);
  await cache.addAll(urls);
  console.log('[ServiceWorker] URLs cached:', urls.length);
}

// IndexedDB helper
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ScamShieldOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offline_scans')) {
        db.createObjectStore('offline_scans', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('analytics')) {
        db.createObjectStore('analytics', { keyPath: 'id' });
      }
    };
  });
}

console.log('[ServiceWorker] Loaded successfully');