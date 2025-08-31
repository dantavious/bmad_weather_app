// Service Worker for BMad Weather Dashboard
// Handles comprehensive offline support, caching, and push notifications

const CACHE_VERSION = 'v3';
const CACHE_PREFIX = 'bmad-weather';
const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic-${CACHE_VERSION}`;
const API_CACHE = `${CACHE_PREFIX}-api-${CACHE_VERSION}`;

// Cache configuration
const CACHE_CONFIG = {
  static: {
    urls: [
      '/',
      '/index.html',
      '/dashboard',
      '/search',
      '/map',
      '/settings/alerts',
      '/solar',
      '/manifest.json',
      '/favicon.ico',
      '/assets/icons/icon-72x72.svg',
      '/assets/icons/icon-96x96.svg',
      '/assets/icons/icon-128x128.svg',
      '/assets/icons/icon-144x144.svg',
      '/assets/icons/icon-152x152.svg',
      '/assets/icons/icon-192x192.svg',
      '/assets/icons/icon-384x384.svg',
      '/assets/icons/icon-512x512.svg'
    ]
  },
  api: {
    maxAge: 5 * 60 * 1000, // 5 minutes
    patterns: [
      /\/api\/weather\//,
      /\/api\/locations\//,
      /\/api\/alerts\//,
      /\/api\/geocode\//
    ]
  },
  dynamic: {
    maxItems: 50
  }
};

// Install event - cache essential files
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static assets...');
        return cache.addAll(CACHE_CONFIG.static.urls)
          .catch(error => {
            console.error('Failed to cache some static assets:', error);
            // Continue installation even if some assets fail
            return Promise.resolve();
          });
      })
      .then(() => {
        console.log('Service Worker installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName.startsWith(CACHE_PREFIX) &&
                     !cacheName.endsWith(CACHE_VERSION);
            })
            .map(cacheName => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('Service Worker activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip cross-origin requests (except for fonts and CDN resources)
  if (url.origin !== self.location.origin) {
    if (url.hostname.includes('googleapis.com') || 
        url.hostname.includes('gstatic.com')) {
      // Cache Google Fonts with cache-first strategy
      event.respondWith(cacheFirst(request, STATIC_CACHE));
    }
    return;
  }

  // Determine caching strategy based on request
  if (isApiRequest(url)) {
    // Network first with cache fallback for API calls
    event.respondWith(networkFirstWithCache(request, API_CACHE));
  } else if (isStaticAsset(url)) {
    // Cache first for static assets
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isNavigationRequest(request)) {
    // Network first for navigation requests to ensure fresh content
    event.respondWith(networkFirstForNavigation(request));
  } else {
    // Stale while revalidate for other dynamic content
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

// Caching Strategies

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('Fetch failed:', error);
    return createOfflineResponse(request);
  }
}

async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Update cache with fresh data
      cache.put(request, response.clone());
      
      // Clean old API cache entries
      cleanApiCache(cache);
    }
    return response;
  } catch (error) {
    console.log('Network failed, trying cache:', request.url);
    const cached = await cache.match(request);
    
    if (cached) {
      // Check if cached response is still fresh
      const cacheTime = cached.headers.get('sw-cache-time');
      if (cacheTime && Date.now() - parseInt(cacheTime) < CACHE_CONFIG.api.maxAge) {
        return cached;
      }
    }
    
    return createOfflineResponse(request);
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        // Clone response and add timestamp header
        const responseWithTime = response.clone();
        const headers = new Headers(responseWithTime.headers);
        headers.append('sw-cache-time', Date.now().toString());
        
        cache.put(request, new Response(responseWithTime.body, {
          status: responseWithTime.status,
          statusText: responseWithTime.statusText,
          headers: headers
        }));
      }
      return response;
    })
    .catch(error => {
      console.error('Background fetch failed:', error);
      return cached || createOfflineResponse(request);
    });
  
  return cached || fetchPromise;
}

async function networkFirstForNavigation(request) {
  try {
    // Always try to fetch the latest index.html for navigation requests
    const response = await fetch('/index.html');
    if (response.ok) {
      return response;
    }
  } catch (error) {
    console.log('Navigation fetch failed, trying cache:', request.url);
    // Fall back to cached index.html
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match('/index.html');
    if (cached) {
      return cached;
    }
  }
  
  return createOfflineResponse(request);
}

// Helper functions

function isApiRequest(url) {
  return CACHE_CONFIG.api.patterns.some(pattern => pattern.test(url.pathname));
}

function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?)$/i) ||
         url.pathname.includes('/assets/');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

async function cleanApiCache(cache) {
  const keys = await cache.keys();
  const now = Date.now();
  
  keys.forEach(async (request) => {
    const response = await cache.match(request);
    const cacheTime = response.headers.get('sw-cache-time');
    
    if (cacheTime && now - parseInt(cacheTime) > CACHE_CONFIG.api.maxAge) {
      cache.delete(request);
    }
  });
}

function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    return new Response(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - BMad Weather</title>
        <style>
          body {
            font-family: 'Roboto', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .offline-container {
            text-align: center;
            padding: 2rem;
          }
          .offline-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
          }
          p {
            font-size: 1.1rem;
            opacity: 0.9;
          }
          .retry-button {
            margin-top: 2rem;
            padding: 0.75rem 2rem;
            font-size: 1rem;
            background: white;
            color: #667eea;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            transition: transform 0.2s;
          }
          .retry-button:hover {
            transform: scale(1.05);
          }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="offline-icon">☁️</div>
          <h1>You're Offline</h1>
          <p>Please check your internet connection and try again.</p>
          <p>Your cached weather data is still available.</p>
          <button class="retry-button" onclick="location.reload()">Try Again</button>
        </div>
      </body>
      </html>
    `, {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/html'
      })
    });
  }
  
  // Return JSON error for API requests
  if (isApiRequest(url)) {
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'No network connection available',
      cached: false
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    });
  }
  
  // Return 503 for other requests
  return new Response('Service Unavailable', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Push event - handle push notifications
self.addEventListener('push', event => {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'Precipitation Alert',
    body: 'Rain/snow starting soon!',
    icon: '/assets/icons/icon-192x192.svg',
    badge: '/assets/icons/icon-72x72.svg',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        vibrate: data.vibrate || notificationData.vibrate,
        data: data.data || notificationData.data,
        tag: data.tag || 'precipitation-alert',
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || []
      };
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Notification click received:', event);
  
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard?alert=true')
    );
  } else if (event.action === 'dismiss') {
    return;
  } else {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then(clientList => {
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url.includes('/dashboard') && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow('/dashboard');
          }
        })
    );
  }
});

// Background sync for offline operations
self.addEventListener('sync', event => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'weather-sync') {
    event.waitUntil(syncWeatherData());
  } else if (event.tag === 'sync-alerts') {
    event.waitUntil(syncAlerts());
  }
});

async function syncWeatherData() {
  try {
    const cache = await caches.open(API_CACHE);
    const keys = await cache.keys();
    
    // Refresh weather data for cached locations
    const weatherRequests = keys.filter(request => 
      request.url.includes('/api/weather/')
    );
    
    for (const request of weatherRequests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response);
        }
      } catch (error) {
        console.error('Failed to sync weather data:', error);
      }
    }
    
    // Notify clients of update
    const allClients = await self.clients.matchAll();
    allClients.forEach(client => {
      client.postMessage({
        type: 'WEATHER_SYNCED',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('Weather sync failed:', error);
  }
}

async function syncAlerts() {
  try {
    const db = await openDB();
    const tx = db.transaction('queuedAlerts', 'readonly');
    const store = tx.objectStore('queuedAlerts');
    const alerts = await store.getAll();
    
    for (const alert of alerts) {
      await sendAlert(alert);
    }
    
    const clearTx = db.transaction('queuedAlerts', 'readwrite');
    const clearStore = clearTx.objectStore('queuedAlerts');
    await clearStore.clear();
  } catch (error) {
    console.error('Alert sync failed:', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BMadWeatherDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('queuedAlerts')) {
        db.createObjectStore('queuedAlerts', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('weatherCache')) {
        db.createObjectStore('weatherCache', { keyPath: 'locationId' });
      }
    };
  });
}

async function sendAlert(alert) {
  try {
    const response = await fetch('/api/alerts/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(alert)
    });
    
    if (!response.ok) {
      throw new Error('Failed to send alert');
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to send alert:', error);
    throw error;
  }
}

// Message event - handle messages from the app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CACHE_URLS') {
    cacheUrls(event.data.urls);
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches();
  }
});

async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.error(`Failed to cache ${url}:`, error);
    }
  }
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter(name => name.startsWith(CACHE_PREFIX))
      .map(name => caches.delete(name))
  );
}