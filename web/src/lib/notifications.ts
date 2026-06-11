/**
 * Push Notifications Infrastructure
 *
 * Provides browser notification permission management, local notifications,
 * service worker push subscription, and subscription persistence to the backend.
 *
 * Real push (VAPID) requires environment variables:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY (server-side only)
 */

// ──────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface SaveSubscriptionResponse {
  ok: boolean;
  id?: string;
  error?: string;
}

// ──────────────────────────────────────────────────────
// Permission helpers
// ──────────────────────────────────────────────────────

/** Returns current Notification permission state. */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Requests browser notification permission.
 * Returns the resolved permission state.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[notifications] Notification API not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// ──────────────────────────────────────────────────────
// Local (in-browser) notifications
// ──────────────────────────────────────────────────────

/** Shows a browser notification immediately. */
export function showLocalNotification(
  title: string,
  body: string,
  options?: NotificationOptions & { onClick?: () => void },
): Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('[notifications] Permission not granted — cannot show notification');
    return null;
  }

  const { onClick, ...notifOpts } = options ?? {};

  const notif = new Notification(title, {
    body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    ...notifOpts,
  });

  if (onClick) {
    notif.onclick = () => {
      window.focus();
      onClick();
      notif.close();
    };
  }

  return notif;
}

// ──────────────────────────────────────────────────────
// Service Worker Push Subscription
// ──────────────────────────────────────────────────────

/** Returns the VAPID public key from environment or a placeholder. */
export function getVapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
}

/**
 * Registers (or retrieves existing) service worker registration
 * and creates a push subscription using the VAPID public key.
 *
 * Returns the PushSubscription or null if push is unavailable.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('[notifications] Service Worker not supported');
    return null;
  }

  const vapidKey = getVapidPublicKey();
  if (!vapidKey) {
    console.warn(
      '[notifications] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set — push subscription skipped. ' +
      'Configure VAPID keys to enable real push notifications.',
    );
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if there's already a subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });
    }

    return subscription;
  } catch (err) {
    console.error('[notifications] Failed to subscribe to push:', err);
    return null;
  }
}

/**
 * Unsubscribes from push and optionally removes from backend.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
    }

    return true;
  } catch (err) {
    console.error('[notifications] Failed to unsubscribe:', err);
    return false;
  }
}

// ──────────────────────────────────────────────────────
// Persist subscription to backend
// ──────────────────────────────────────────────────────

/**
 * Sends the push subscription to the backend API for storage.
 */
export async function saveSubscription(
  subscription: PushSubscription,
): Promise<SaveSubscriptionResponse> {
  const payload: PushSubscriptionPayload = {
    endpoint: subscription.endpoint,
    keys: subscription.toJSON().keys as { p256dh: string; auth: string },
  };

  try {
    const res = await fetch('/api/notificacoes/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.error ?? 'Erro ao salvar inscrição' };
    }

    return { ok: true, id: data.id };
  } catch (err) {
    console.error('[notifications] Error saving subscription:', err);
    return { ok: false, error: 'Erro de conexão' };
  }
}

// ──────────────────────────────────────────────────────
// Convenience: request + subscribe + save
// ──────────────────────────────────────────────────────

/**
 * Full flow: request permission → subscribe to push → save to backend.
 * Returns the subscription if successful, null otherwise.
 */
export async function enablePushNotifications(): Promise<PushSubscription | null> {
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    return null;
  }

  const subscription = await subscribeToPush();
  if (!subscription) {
    return null;
  }

  const result = await saveSubscription(subscription);
  if (!result.ok) {
    console.error('[notifications] Failed to save subscription:', result.error);
  }

  return subscription;
}

// ──────────────────────────────────────────────────────
// Utility: VAPID key conversion
// ──────────────────────────────────────────────────────

/** Converts a base64-encoded VAPID key to Uint8Array for the push manager. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = typeof window !== 'undefined'
    ? window.atob(base64)
    : Buffer.from(base64, 'base64').toString('binary');

  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
