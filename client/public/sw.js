// Keep the cache versioned so a deployed service-worker update can retire
// assets from an older release instead of pinning the app shell forever.
const CACHE_NAME = 'allrated-v4';
const SHELL_ASSETS = ['/', '/index.html', '/manifest.webmanifest'];

// Install: cache the static shell and activate this worker immediately.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache =>
        Promise.all(
          SHELL_ASSETS.map(asset => cache.add(asset).catch(() => undefined)),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

// Activate: remove every cache from an older worker, then take control.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch: always prefer the network for navigations and API responses. The
// document contains the current hashed asset filenames, so serving an old
// cached document is enough to make an otherwise successful deployment look
// like it never updated.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate' || url.pathname === '/index.html' || url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(cacheFirst(event.request));
  }
});

// Messages: allow the page to activate a waiting worker immediately.
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (
      (await caches.match(request)) ||
      new Response('Network unavailable', { status: 503 })
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}