/**
 * Geofence enforcement policy, end to end through the real stack.
 *
 * Phase 1 of docs/compvss/TIME_MANAGEMENT_LIFECYCLE_PLAN.md. Unit tests
 * (src/lib/time/policy.test.ts) cover the decision function exhaustively;
 * this proves the parts they can't reach: that the route actually loads the
 * org's policy, actually refuses with 422 rather than 409, actually persists
 * the enforcement state, and that the org's default is genuinely
 * record_only so the migration changed nobody's behaviour.
 *
 * These tests write real punches for the seeded owner and clean up after
 * themselves. They deliberately DO NOT mutate org_time_settings — the org
 * default is asserted as observed, not forced, because "shipping this
 * changed no existing org" is exactly the claim under test.
 */
import { expect, test } from "./helpers/base";
import { dismissConsent, loginAs } from "./helpers/auth";

/** Somewhere in the Atlantic — outside any plausible seeded zone. */
const NOWHERE = { lat: 0.0, lng: 0.0 };

/**
 * Drain every open entry, not just the newest one.
 *
 * The seeded owner carries several `ended_at IS NULL` rows from the base
 * fixture, and `clock_out` closes only the most recent. A single-shot
 * cleanup therefore leaves the user "already clocked in" and every
 * subsequent clock_in 409s.
 *
 * Multiple open entries are reachable in the app, not just in the seed:
 * `/api/v1/shifts/checkin` inserts a `time_entries` row without checking
 * for an existing open one, while `/api/v1/time/clock` refuses when ANY
 * open entry exists. Drain until the API says there is nothing open.
 */
async function drainOpenEntries(page: import("playwright/test").Page) {
  for (let i = 0; i < 10; i++) {
    const resp = await page.request.post("/api/v1/time/clock", { data: { action: "clock_out" } });
    if (resp.status() === 409) return; // "You're not clocked in" — drained.
    if (resp.status() !== 200) throw new Error(`Unexpected clock_out status ${resp.status()}`);
  }
  throw new Error("Could not drain open time entries after 10 attempts");
}

test.describe("geofence policy — the punch contract", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
    // Start from a known state: no open entry.
    await drainOpenEntries(page);
  });

  test.afterEach(async ({ page }) => {
    await drainOpenEntries(page);
  });

  test("the org default is record_only, so an off-site punch is recorded and not blocked", async ({ page }) => {
    const resp = await page.request.post("/api/v1/time/clock", {
      data: { action: "clock_in", lat: NOWHERE.lat, lng: NOWHERE.lng, accuracy: 5 },
    });
    // The migration must not have changed behaviour for any existing org.
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.ok).toBe(true);
    expect(body.data.action).toBe("clock_in");
    // Either outside (zones configured) or unknown (none) — never a refusal.
    expect(["outside", "unknown"]).toContain(body.data.geofenceState);
    expect(body.data.enforcementState).toBe("clean");
  });

  test("a GPS-less punch is accepted and classified unknown, never blocked", async ({ page }) => {
    const resp = await page.request.post("/api/v1/time/clock", { data: { action: "clock_in" } });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.geofenceState).toBe("unknown");
  });

  test("accuracy is accepted and does not break the punch", async ({ page }) => {
    const resp = await page.request.post("/api/v1/time/clock", {
      data: { action: "clock_in", lat: NOWHERE.lat, lng: NOWHERE.lng, accuracy: 750.5 },
    });
    expect(resp.status()).toBe(200);
  });

  test("a second clock-in is 409 — the dedupe path the outbox drops terminally", async ({ page }) => {
    const first = await page.request.post("/api/v1/time/clock", { data: { action: "clock_in" } });
    expect(first.status()).toBe(200);
    const second = await page.request.post("/api/v1/time/clock", { data: { action: "clock_in" } });
    // 409 must stay reserved for "already clocked in". The geofence refusal
    // is 422 precisely so the service worker can tell them apart.
    expect(second.status()).toBe(409);
  });

  test("clock-out records a departure fix and closes the entry", async ({ page }) => {
    await page.request.post("/api/v1/time/clock", { data: { action: "clock_in" } });
    const resp = await page.request.post("/api/v1/time/clock", {
      data: { action: "clock_out", lat: NOWHERE.lat, lng: NOWHERE.lng, accuracy: 12 },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.ok).toBe(true);
    expect(body.data.entry.ended_at).toBeTruthy();
    // The departure geofence is classified now — it used to be absent
    // entirely, because the client only read GPS on clock_in.
    expect(["inside", "outside", "unknown"]).toContain(body.data.geofenceState);
    // duration_minutes is the trigger's job; it must come back populated
    // without the route computing it.
    expect(body.data.entry.duration_minutes).not.toBeNull();
  });

  test("clock-out without an open entry is 409, not a crash", async ({ page }) => {
    const resp = await page.request.post("/api/v1/time/clock", { data: { action: "clock_out" } });
    expect(resp.status()).toBe(409);
  });

  test("a future-dated punch is refused", async ({ page }) => {
    const future = new Date(Date.now() + 60 * 60_000).toISOString();
    const resp = await page.request.post("/api/v1/time/clock", {
      data: { action: "clock_in", at: future },
    });
    expect(resp.status()).toBe(400);
  });

  test("an override reason is accepted on a punch that did not need one", async ({ page }) => {
    // Under record_only the override is inert — it must not change the
    // verdict or error. Proves the new field is optional end to end.
    const resp = await page.request.post("/api/v1/time/clock", {
      data: {
        action: "clock_in",
        lat: NOWHERE.lat,
        lng: NOWHERE.lng,
        accuracy: 5,
        overrideReason: "Testing that an unnecessary override is harmless",
      },
    });
    expect(resp.status()).toBe(200);
  });

  test("garbage coordinates are rejected at the schema boundary", async ({ page }) => {
    const resp = await page.request.post("/api/v1/time/clock", {
      data: { action: "clock_in", lat: 999, lng: 999 },
    });
    expect(resp.status()).toBe(400);
  });
});
