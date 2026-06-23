const CACHE_NAME = 'gst-simulator-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/favicon.svg',
  '/icons.svg',
  '/manifest.json'
];

// Install Event - Pre-cache core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline shell');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Handle cache lookups and navigation fallbacks
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Bypass service worker caching for API calls (handled in API client offline client fallback)
  if (requestUrl.pathname.includes('/api/')) {
    return;
  }

  // Handle SPA routing: serve index.html for all page navigation requests when offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.log('[Service Worker] Offline navigation fallback to index.html');
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Stale-while-revalidate for other requests (CSS, JS bundles, fonts, images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached resource immediately, and update the cache in background
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Ignore background refresh errors if offline
          });
        return cachedResponse;
      }

      // If not in cache, fetch from network and save clone to cache
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Return empty response or handle fallback if image/font fails offline
        if (event.request.headers.get('accept').includes('image')) {
          return caches.match('/logo.png');
        }
      });
    })
  );
});
