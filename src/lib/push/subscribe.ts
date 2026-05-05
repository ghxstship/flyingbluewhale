/**
 * Browser-side helpers for Web Push subscription (Phase 2.3).
 *
 * No "use client" pragma — this module is imported from Client Components
 * and never reaches the server. Every function feature-detects so callers
 * can render an "unsupported" message on Safari < 16, private windows, etc.
 */

export type PushSupport = { supported: true } | { supported: false; reason: string };

export function detectPushSupport(): PushSupport {
  if (typeof window === "undefined") return { supported: false, reason: "Not in a browser." };
  if (!("Notification" in window)) return { supported: false, reason: "Notifications API unavailable." };
  if (!("serviceWorker" in navigator)) return { supported: false, reason: "Service workers unavailable." };
  if (!("PushManager" in window)) return { supported: false, reason: "Push API unavailable." };
  return { supported: true };
}

export function currentPermission(): NotificationPermission {
  if (typeof Notification === "undefined") return "denied";
  return Notification.permission;
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) return existing;
    return await navigator.serviceWorker.register("/service-worker.js");
  } catch {
    return null;
  }
}

export type SerializedSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export function serializeSubscription(sub: PushSubscription): SerializedSubscription {
  const json = sub.toJSON();
  const keys = (json.keys ?? {}) as Record<string, string>;
  return {
    endpoint: sub.endpoint,
    keys: {
      p256dh: keys.p256dh ?? arrayBufferToBase64(sub.getKey("p256dh")),
      auth: keys.auth ?? arrayBufferToBase64(sub.getKey("auth")),
    },
  };
}

export async function getOrCreateSubscription(vapidPublicKey: string): Promise<SerializedSubscription | null> {
  const reg = await getServiceWorkerRegistration();
  if (!reg) return null;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }
  return serializeSubscription(sub);
}

export async function unsubscribeCurrent(): Promise<string | null> {
  const reg = await getServiceWorkerRegistration();
  if (!reg) return null;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  return endpoint;
}
