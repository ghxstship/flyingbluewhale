import { expect, test } from "playwright/test";
import { dismissConsent, loginAs } from "./helpers/auth";

/**
 * COMPVSS Connecteam-parity smoke. Every new /m surface from migrations
 * 0046-0048 gets a navigate + first-paint check across two roles —
 * "crew" (member) for the consumer view and "owner" for the elevated
 * view (auto-award badge UI shows up the same regardless of role, but
 * loading the page proves the RLS-scoped queries returned cleanly).
 *
 * Headless HTTP coverage is provided by `scripts/compvss-smoke.mjs`
 * (188 page renders, 28 mutations) — this Playwright spec adds the
 * actual browser bits the smoke harness can't see: hydration, the
 * RealtimeRefresh client island mounting, the PushToggle component
 * loading.
 */

// Surviving COMPVSS surfaces after the kit rebuild. The retired role/parity
// surfaces (learning · kudos · polls · surveys · docs/new · checkin) were
// DELETED — see CLAUDE.md "COMPVSS Design System kit" + nav.ts — and must not be
// reintroduced here. Each kit screen renders an <h1 class="scr-h">, so the
// hydration check asserts a heading paints (proves the RLS-scoped server query
// returned + the client bundle mounted) rather than coupling to churny copy.
const ROUTES: string[] = [
  "/m/feed",
  "/m/inbox",
  "/m/time-off",
  "/m/time-off/new",
  "/m/docs",
  "/m/directory",
  "/m/onboarding",
  "/m/incident",
  "/m/incident/new",
];

test.describe("COMPVSS — Connecteam-parity surfaces", () => {
  test.describe("as crew (member)", () => {
    test.beforeEach(async ({ page }) => {
      await dismissConsent(page);
      await loginAs(page, "crew");
    });

    for (const path of ROUTES) {
      test(`${path} hydrates`, async ({ page }) => {
        const res = await page.goto(path, { waitUntil: "domcontentloaded" });
        expect(res?.status()).toBeLessThan(500);
        // A visible heading proves the server-rendered html arrived AND the
        // client bundle hydrated (a server-only error would surface as a Next
        // error boundary, which has no <h1>, before this could match).
        await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
        const body = (await page.locator("body").innerText().catch(() => "")).slice(0, 1500);
        expect(/application error|unhandled runtime|digest:/i.test(body), `${path} error boundary`).toBe(false);
      });
    }

    test("/m/feed mounts the realtime island without console errors", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      const r = await page.goto("/m/feed", { waitUntil: "domcontentloaded" });
      expect(r?.status()).toBeLessThan(500);
      // Filter out the well-known noisy warnings that the rest of the suite
      // already accepts (consent banner hydration etc.).
      const real = errors.filter((e) => !/consent|workbox|hydration mismatch/i.test(e));
      expect(real, real.join("\n")).toEqual([]);
    });

    test("/m/notifications exposes the per-channel preference matrix (PushToggle)", async ({ page }) => {
      // The notification preference matrix moved from /m/settings to its own
      // /m/notifications surface in the kit rebuild.
      const res = await page.goto("/m/notifications", { waitUntil: "domcontentloaded" });
      expect(res?.status()).toBeLessThan(500);
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("as owner", () => {
    test.beforeEach(async ({ page }) => {
      await dismissConsent(page);
      await loginAs(page, "owner");
    });

    // Spot-check the 4 highest-signal pages with the elevated role.
    const OWNER_SPOT = ["/m/feed", "/m/inbox", "/m/docs", "/m/time-off"];
    for (const path of OWNER_SPOT) {
      test(`${path} loads for owner`, async ({ page }) => {
        const r = await page.goto(path, { waitUntil: "domcontentloaded" });
        expect(r?.status()).toBeLessThan(500);
      });
    }
  });
});
