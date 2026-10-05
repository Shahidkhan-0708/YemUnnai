/* YEMUNNAI service worker — offline shell + stale-while-revalidate static assets. */
const CACHE = 'yemunnai-v22';
const PRECACHE = ['/'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Cross-origin (fonts, analytics, Supabase) goes straight to the network.
  if (url.origin !== self.location.origin) return;
  // Never cache Vercel internal endpoints.
  if (url.pathname.startsWith('/_vercel/') || url.pathname.startsWith('/api/')) return;

  // Pages: network-first with cached shell as fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put('/', fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          const cached = await caches.match('/');
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Static assets: cache-first, refreshed in the background.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      // Content-hashed assets are immutable; avoid downloading them again.
      if (cached && (url.pathname.startsWith('/images/optimized/') || url.pathname.startsWith('/assets/'))) return cached;
      const network = fetch(request)
        .then(async (response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const cache = await caches.open(CACHE);
            await cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })()
  );
});
