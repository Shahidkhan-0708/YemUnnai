/* YEMUNNAI service worker — offline shell + stale-while-revalidate static assets. */
const CACHE = 'yemunnai-v33';
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

/* -------------------------------------------------------------------------
 * Push Notification Background Listener
 * Wakes up device in background / sleep state when student pre-orders arrive.
 * ------------------------------------------------------------------------- */
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { title: 'New Campus Pre-Order', body: event.data.text() };
    }
  }

  const title = payload.title || 'New Campus Pre-Order';
  const orderId = payload.orderId || payload.data?.orderId || Date.now();
  const options = {
    body: payload.body || 'A student placed a new campus pre-order.',
    icon: payload.icon || '/favicon.svg',
    badge: payload.badge || '/favicon.svg',
    tag: `kitchen-order-${orderId}`,
    renotify: true,
    requireInteraction: true, // Forces notification to stay until acted upon
    vibrate: [400, 150, 400, 150, 600], // Urgent kitchen alert pulse pattern
    data: {
      url: payload.url || '/?portal=business',
      orderId,
      ...payload
    },
    actions: [
      { action: 'accept', title: 'Accept Order' },
      { action: 'decline', title: 'Decline' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/?portal=business';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes('/?portal=business') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open dedicated window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

