"use client";

/**
 * Native device permission requests for the COMPVSS mobile app.
 *
 * COMPVSS ships as a Capacitor PWA. Today these requests run against **web
 * platform APIs** (Geolocation, Notification, getUserMedia, Web Bluetooth /
 * Web NFC) which work inside the Capacitor WebView and in the browser PWA. At
 * native packaging time, each branch swaps to the matching Capacitor plugin
 * (`@capacitor/geolocation`, `@capacitor/push-notifications`, `@capacitor/camera`)
 * — see the `TODO(native)` markers below.
 *
 * This module is `"use client"`-safe: pure browser, no server imports, and the
 * only dependency beyond the DOM is an optional, guarded `@capacitor/core`
 * import for platform detection.
 */

export type PermissionKind = "location" | "notifications" | "camera" | "bluetooth";

export type PermissionResult = { granted: boolean; unavailable?: boolean };

/**
 * True when running inside a native Capacitor shell (iOS/Android), false on the
 * web/PWA or if `@capacitor/core` is unavailable. The require is guarded so the
 * module never throws when the package isn't resolvable at runtime.
 */
export function isNativePlatform(): boolean {
  try {
    const cap = require("@capacitor/core") as { Capacitor?: { isNativePlatform?: () => boolean } };
    return Boolean(cap?.Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

type NavWithBluetooth = Navigator & {
  bluetooth?: { requestDevice(opts: { acceptAllDevices?: boolean }): Promise<unknown> };
};

function hasGeolocation(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

function hasNotification(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

function hasMediaDevices(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

function hasBluetooth(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

function hasNfc(): boolean {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

/**
 * Feature-detect which permission kinds this device/runtime can even request.
 * Drives the "Unavailable on this device" UI hints — distinct from whether the
 * user has granted them.
 */
export function checkPermissionsSupport(): Record<PermissionKind, boolean> {
  return {
    location: hasGeolocation(),
    notifications: hasNotification(),
    camera: hasMediaDevices(),
    bluetooth: hasBluetooth() || hasNfc(),
  };
}

/**
 * Request a single permission. Resolves `{ granted, unavailable? }` and never
 * throws — every branch is wrapped so a rejected/denied prompt resolves to
 * `granted:false` instead of bubbling.
 */
export async function requestPermission(kind: PermissionKind): Promise<PermissionResult> {
  switch (kind) {
    case "location": {
      // TODO(native): swap to @capacitor/geolocation `Geolocation.requestPermissions()` when the native build adds the plugin.
      if (!hasGeolocation()) return { granted: false, unavailable: true };
      try {
        return await new Promise<PermissionResult>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve({ granted: true }),
            (e) => {
              // PERMISSION_DENIED === 1; treat any failure as not-granted.
              if (e && e.code === e.PERMISSION_DENIED) resolve({ granted: false });
              else resolve({ granted: false });
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
          );
        });
      } catch {
        return { granted: false };
      }
    }

    case "notifications": {
      // TODO(native): swap to @capacitor/push-notifications `PushNotifications.requestPermissions()` when the native build adds the plugin.
      if (!hasNotification()) return { granted: false, unavailable: true };
      try {
        const result = await Notification.requestPermission();
        return { granted: result === "granted" };
      } catch {
        return { granted: false };
      }
    }

    case "camera": {
      // TODO(native): swap to @capacitor/camera `Camera.requestPermissions()` when the native build adds the plugin.
      if (!hasMediaDevices()) return { granted: false, unavailable: true };
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // We only wanted the grant — release the camera immediately.
        stream.getTracks().forEach((track) => track.stop());
        return { granted: true };
      } catch {
        return { granted: false };
      }
    }

    case "bluetooth": {
      // TODO(native): swap to a Capacitor BLE/NFC plugin when the native build adds the plugin.
      try {
        const nav = navigator as NavWithBluetooth;
        if (nav.bluetooth && typeof nav.bluetooth.requestDevice === "function") {
          try {
            await nav.bluetooth.requestDevice({ acceptAllDevices: true });
            return { granted: true };
          } catch {
            // User cancelled the chooser, or no device selected.
            return { granted: false };
          }
        }
        // Fall back to probing Web NFC, which also needs a user-gesture grant.
        if (hasNfc()) {
          try {
            // Constructing NDEFReader doesn't prompt; scan() triggers the grant.
            const Reader = (window as unknown as { NDEFReader: new () => { scan(): Promise<void> } }).NDEFReader;
            const reader = new Reader();
            await reader.scan();
            return { granted: true };
          } catch {
            return { granted: false };
          }
        }
        return { granted: false, unavailable: true };
      } catch {
        return { granted: false, unavailable: true };
      }
    }

    default:
      return { granted: false, unavailable: true };
  }
}
