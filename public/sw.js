// Service Worker for PWA functionality
// Auto-switching device-aware caching and offline support

const CACHE_NAME = 'expensoo-v1';
const RUNTIME_CACHE = 'expensoo-runtime';

// Assets to cache immediately
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  // Add other critical assets
];

// Install event - precache critical assets
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: Precaching assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // Force activation of new service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
          .map(cacheName => {
            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const { url, method } = request;
  
  // Only handle GET requests
  if (method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (!url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    (async () => {
      try {
        // Try cache first for navigation requests
        if (request.mode === 'navigate') {
          const cachedResponse = await caches.match('/index.html');
          if (cachedResponse) {
            return cachedResponse;
          }
        }
        
        // Try cache for other requests
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          // Return cached version and update cache in background
          updateCacheInBackground(request);
          return cachedResponse;
        }
        
        // Fetch from network
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
      } catch (error) {
        console.error('Service Worker fetch error:', error);
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          const offlineResponse = await caches.match('/index.html');
          return offlineResponse || new Response('App offline', { status: 503 });
        }
        
        throw error;
      }
    })()
  );
});

// Background cache update
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Silently fail background updates
  }
}

// Listen for messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🚀 Service Worker: Ready for PWA functionality');
