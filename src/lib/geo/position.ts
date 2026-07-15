"use client";

/**
 * Best-effort device position fix — the single geolocation entry point for
 * field surfaces (clock punches, photo capture).
 *
 * Extracted from `useClockPunch` so photo geotagging inherits the same
 * hardening rather than growing a second, subtly different implementation.
 *
 * The contract is deliberately forgiving: this NEVER rejects and never
 * blocks a field write for more than ~4s. A denial, a timeout, an indoor
 * dead-zone, or a browser without the API all resolve `null`. Callers
 * record "no fix" rather than failing the user's submission — a crew member
 * filing a safety report in a concrete loading dock must not be stopped by
 * a GPS that can't see sky.
 */

export type Fix = {
  lat: number;
  lng: number;
  /** Fix radius in metres (`coords.accuracy`), 68% confidence per the spec.
   *  Persisted so a reviewer can tell a 5m rooftop fix from a 2km tower
   *  triangulation — the difference between evidence and a rumour. */
  accuracy: number | null;
};

/** Hard ceiling on how long a caller waits for a fix. The inner
 *  `positionOptions.timeout` is set below this; the outer timer exists
 *  because some browsers hang instead of honoring it while permission UI
 *  is still pending. */
const FIX_DEADLINE_MS = 4500;
const FIX_TIMEOUT_MS = 4000;

/** Reuse a fix this recent rather than waking the GPS again. Photo capture
 *  fires this per shot; a burst of 5 photos should not mean 5 cold starts. */
const MAX_AGE_MS = 60_000;

export function getPosition(): Promise<Fix | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    let settled = false;
    const done = (value: Fix | null) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    // Belt-and-suspenders timeout — some browsers hang instead of honoring
    // the positionOptions timeout when permission UI is pending.
    const timer = setTimeout(() => done(null), FIX_DEADLINE_MS);
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          done({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
          });
        },
        () => {
          clearTimeout(timer);
          done(null);
        },
        { enableHighAccuracy: true, timeout: FIX_TIMEOUT_MS, maximumAge: MAX_AGE_MS },
      );
    } catch {
      clearTimeout(timer);
      done(null);
    }
  });
}

/**
 * Current permission state without prompting — lets a UI tell the user
 * "location is off" before they shoot, instead of after. Resolves
 * "unknown" wherever the Permissions API is absent (Safari < 16).
 */
export async function geoPermission(): Promise<"granted" | "denied" | "prompt" | "unknown"> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) return "unknown";
  try {
    const st = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return st.state;
  } catch {
    return "unknown";
  }
}
