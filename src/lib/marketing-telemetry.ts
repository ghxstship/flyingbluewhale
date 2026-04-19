"use client";

/**
 * Marketing telemetry — M3-05 / IK-039.
 *
 * Tiny client-side beacon helper. Calls `navigator.sendBeacon` where
 * supported so the request survives page unload (e.g. clicking Sign Up
 * immediately navigates away — sendBeacon still delivers). Falls back
 * to `fetch` with `keepalive: true` on browsers without `sendBeacon`.
 *
 * Failures are silent by design; marketing analytics must never block
 * or surface to the user.
 */

const ENDPOINT = "/api/v1/telemetry/marketing";

export type MarketingEvent =
  | "marketing.theme.picked"
  | "marketing.locale.switched"
  | "marketing.cta.clicked"
  | "marketing.page.viewed"
  | "marketing.hero.cta_clicked"
  | "marketing.pricing.plan_clicked"
  | "marketing.signup.started";

export type TelemetryProps = Record<string, string | number | boolean | null>;

export function track(event: MarketingEvent, props?: TelemetryProps): void {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({ event, props });
  try {
    // sendBeacon returns false if the user-agent rejects it (payload too
    // big, origin block, etc). In that case, fall back to fetch().
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, blob)) return;
    // Fallback — keepalive lets the request survive navigation.
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never throw from telemetry */
  }
}
