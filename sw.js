// Service Worker for Pixel Nest - Background Sync and Offline Support

const CACHE_NAME = 'pixel-nest-v2'; // Bumped version
const OFFLINE_URL = '/expenso/offline.html';

// Files to cache for offline use
const CACHE_FILES = [
  '/expenso/',
  '/expenso/index.html',
  '/expenso/static/js/bundle.js',
  '/expenso/static/css/main.css',
  '/expenso/manifest.json',
  '/expenso/favicon.ico',
  OFFLINE_URL
];

// Install event - cache files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(CACHE_FILES);
      })
      .then(() => {
        console.log('Service Worker: Installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(async () => {
        const cache = await caches.open('v1');
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) return cachedResponse;
        // Fallback to a generic response for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/expenso/index.html');
        }
        return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});

// Handle API requests with offline support
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful GET responses
    if (response.ok && request.method === 'GET') {
      const responseClone = response.clone();
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    console.log('API request failed, trying cache:', request.url);
    
    // Try cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'No internet connection and no cached data available' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync offline actions with backend
async function syncOfflineActions() {
  try {
    // Get offline queue from IndexedDB or localStorage
    const offlineQueue = await getOfflineQueue();
    
    if (offlineQueue.length === 0) {
      console.log('No offline actions to sync');
      return;
    }

    console.log(`Syncing ${offlineQueue.length} offline actions`);

    for (const action of offlineQueue) {
      try {
        await processOfflineAction(action);
        await removeFromOfflineQueue(action.id);
        console.log('Synced action:', action);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
        // Increment retry count
        action.retryCount = (action.retryCount || 0) + 1;
        
        if (action.retryCount >= 3) {
          await removeFromOfflineQueue(action.id);
          console.warn('Removed action after max retries:', action);
        } else {
          await updateOfflineQueue(action);
        }
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Process individual offline action
async function processOfflineAction(action) {
  const backends = [
    'https://positive-kodiak-friendly.ngrok-free.app'
  ];

  for (const backendUrl of backends) {
    try {
      const url = `${backendUrl}${action.endpoint}`;
      const token = await getStoredToken();
      
      const response = await fetch(url, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: action.data ? JSON.stringify(action.data) : undefined
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`Backend ${backendUrl} failed:`, error);
      continue;
    }
  }

  throw new Error('All backends failed');
}

// Get stored authentication token
async function getStoredToken() {
  // Try to get from localStorage via postMessage
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    try {
      const response = await client.postMessage({
        type: 'GET_TOKEN'
      });
      if (response && response.token) {
        return response.token;
      }
    } catch (error) {
      console.warn('Failed to get token from client:', error);
    }
  }
  return null;
}

// Offline queue management
async function getOfflineQueue() {
  try {
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      try {
        const response = await client.postMessage({
          type: 'GET_OFFLINE_QUEUE'
        });
        if (response && response.queue) {
          return response.queue;
        }
      } catch (error) {
        console.warn('Failed to get offline queue from client:', error);
      }
    }
  } catch (error) {
    console.error('Failed to get offline queue:', error);
  }
  return [];
}

async function removeFromOfflineQueue(actionId) {
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    try {
      await client.postMessage({
        type: 'REMOVE_FROM_OFFLINE_QUEUE',
        actionId
      });
    } catch (error) {
      console.warn('Failed to remove from offline queue:', error);
    }
  }
}

async function updateOfflineQueue(action) {
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    try {
      await client.postMessage({
        type: 'UPDATE_OFFLINE_QUEUE',
        action
      });
    } catch (error) {
      console.warn('Failed to update offline queue:', error);
    }
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'QUEUE_OFFLINE_ACTION':
      console.log('Queued offline action:', data);
      // Store action in IndexedDB or localStorage
      break;
      
    case 'GET_TOKEN':
      // Return stored token
      event.ports[0].postMessage({ token: null });
      break;
      
    case 'GET_OFFLINE_QUEUE':
      // Return offline queue
      event.ports[0].postMessage({ queue: [] });
      break;
      
    case 'REMOVE_FROM_OFFLINE_QUEUE':
      // Remove action from queue
      break;
      
    case 'UPDATE_OFFLINE_QUEUE':
      // Update action in queue
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.ico'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Pixel Nest', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

console.log('Service Worker: Loaded'); 