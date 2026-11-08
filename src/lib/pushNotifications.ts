/**
 * Web Push & Background Notification Management for YemEmUnnai
 * Manages service worker push subscriptions and kitchen alerts.
 */

import { playKitchenOrderAlert } from './celebration';

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Checks if Notification and Service Worker APIs are supported by this client.
 */
export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window;
}

/**
 * Gets the current notification permission state.
 */
export function getNotificationPermission(): PushPermissionStatus {
  if (!isPushNotificationSupported()) return 'unsupported';
  return Notification.permission as PushPermissionStatus;
}

/**
 * Requests push notification permission and registers subscription with Service Worker.
 */
export async function requestPushPermission(): Promise<PushPermissionStatus> {
  if (!isPushNotificationSupported()) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerServiceWorkerPush();
      playKitchenOrderAlert();
    }
    return permission as PushPermissionStatus;
  } catch (err) {
    console.error('[PushNotifications] Failed to request permission:', err);
    return 'denied';
  }
}

/**
 * Registers or retrieves the active Service Worker Push Subscription.
 */
export async function registerServiceWorkerPush(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // VAPID application server public key placeholder or custom server key
      // If VAPID is not set in env, we request push subscription if supported
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const options: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
        ...(vapidKey ? { applicationServerKey: urlB64ToUint8Array(vapidKey) as unknown as BufferSource } : {})
      };

      try {
        subscription = await registration.pushManager.subscribe(options);
      } catch {
        // Fallback: registration without custom VAPID for browser-level notification hooks
        subscription = null;
      }
    }

    if (subscription) {
      // Persist locally for vendor device tracking
      try {
        localStorage.setItem('yemunnai_push_subscription', JSON.stringify(subscription));
      } catch {
        // Ignore storage exceptions
      }
    }

    return subscription;
  } catch (err) {
    console.warn('[PushNotifications] Error registering push subscription:', err);
    return null;
  }
}

/**
 * Fires a test kitchen notification to prove the background pipe works on this device.
 */
export async function sendTestKitchenNotification(orderId = 'TEST-101'): Promise<boolean> {
  if (!isPushNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  playKitchenOrderAlert();

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('🔥 NEW CAMPUS PRE-ORDER (#104)', {
      body: '1x Veg Fried Rice · Reaching in 5 mins',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: `kitchen-order-${orderId}`,
      renotify: true,
      requireInteraction: true,
      vibrate: [400, 150, 400, 150, 600],
      data: {
        url: '/?portal=business',
        orderId
      }
    } as any);
    return true;
  } catch (err) {
    console.error('[PushNotifications] Test notification failed:', err);
    return false;
  }
}

/**
 * Helper to convert a Base64 VAPID public key into a Uint8Array.
 */
function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
