/**
 * The COMPVSS emergency offline tier (M0-b F3).
 *
 * A crew member underground must be able to open the evac / crisis-code
 * reference with ZERO signal. These routes are cached by the service worker
 * into a DEDICATED cache (`atlvs-emergency-<version>`) that is exempt from
 * the runtime cache's FIFO trim, so a busy shift can never evict them.
 * Visiting the hub warms the whole tier; an offline serve carries the
 * existing stale-data-age signal (SERVED_STALE → SyncBanner "updated Xm
 * ago") so the crew knows how old the copy is.
 *
 * The service worker is plain JS loaded from /service-worker.js and cannot
 * import from `src/`, so `public/service-worker.js` carries its own
 * EMERGENCY_ROUTES literal. This module is the app-side mirror;
 * `queueable-endpoints.test.ts` holds the two in lockstep (same pattern as
 * QUEUEABLE_ENDPOINTS).
 */
export const EMERGENCY_ROUTES = [
  "/m/emergency",
  "/m/emergency/codes",
  "/m/emergency/fire",
  "/m/emergency/evacuation",
  "/m/emergency/shelter",
] as const;

export type EmergencyRoute = (typeof EMERGENCY_ROUTES)[number];
