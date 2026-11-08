/**
 * Firebase Cloud Messaging Service Worker for YemEmUnnai
 * Handles background push payloads, lock-screen alarms, and kitchen wakeup events
 * for canteen tablets and vendor dashboards.
 */

/* eslint-disable no-restricted-globals */
// Import Firebase SDK compat scripts for Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Optional: Retrieve runtime config via query parameters or fallback defaults
const urlParams = new URL(location.href).searchParams;
const firebaseConfig = {
  apiKey: urlParams.get('apiKey') || '',
  authDomain: urlParams.get('authDomain') || '',
  projectId: urlParams.get('projectId') || '',
  storageBucket: urlParams.get('storageBucket') || '',
  messagingSenderId: urlParams.get('messagingSenderId') || '',
  appId: urlParams.get('appId') || ''
};

// Initialize Firebase inside the service worker if configuration is supplied
if (firebaseConfig.projectId) {
  try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[FCM-SW] Received background message:', payload);

      const title = payload.notification?.title || payload.data?.title || '🔥 New Campus Pre-Order';
      const orderId = payload.data?.orderId || payload.data?.token_number || Date.now();
      const body = payload.notification?.body || payload.data?.body || 'New student pre-order awaiting preparation.';

      const notificationOptions = {
        body,
        icon: payload.notification?.icon || '/images/optimized/NewLogo-e14eee5ea6-128.webp',
        badge: '/favicon.svg',
        tag: `kitchen-order-${orderId}`,
        renotify: true,
        requireInteraction: true,
        vibrate: [400, 150, 400, 150, 600],
        data: {
          url: payload.data?.url || '/?portal=business',
          orderId,
          ...payload.data
        },
        actions: [
          { action: 'accept', title: 'Accept Order' },
          { action: 'decline', title: 'Decline' }
        ]
      };

      // Broadcast message to any active tabs so the dashboard updates state immediately
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'KITCHEN_ORDER_RECEIVED',
            order: payload.data
          });
        });
      });

      return self.registration.showNotification(title, notificationOptions);
    });
  } catch (err) {
    console.warn('[FCM-SW] Firebase initialization warning:', err);
  }
}

/**
 * Fallback native push listener for standard Web Push payloads
 * Ensures delivery even if Firebase Compat fails to boot or during offline cache fallback.
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: '🔥 New Campus Pre-Order', body: event.data.text() };
  }

  const notificationData = payload.notification || payload;
  const customData = payload.data || {};
  const orderId = customData.orderId || customData.token_number || Date.now();

  const title = notificationData.title || '🔥 New Campus Pre-Order';
  const options = {
    body: notificationData.body || 'A student placed a new campus pre-order.',
    icon: notificationData.icon || '/images/optimized/NewLogo-e14eee5ea6-128.webp',
    badge: '/favicon.svg',
    tag: `kitchen-order-${orderId}`,
    renotify: true,
    requireInteraction: true,
    vibrate: [400, 150, 400, 150, 600],
    data: {
      url: customData.url || '/?portal=business',
      orderId,
      ...customData
    },
    actions: [
      { action: 'accept', title: 'Accept Order' },
      { action: 'decline', title: 'Decline' }
    ]
  };

  // Broadcast to open dashboard windows
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'KITCHEN_ORDER_RECEIVED',
          order: customData
        });
      });
      return self.registration.showNotification(title, options);
    })
  );
});

/**
 * Handle notification clicks: bring vendor dashboard into focus or navigate to it.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/?portal=business';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/?portal=business') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
