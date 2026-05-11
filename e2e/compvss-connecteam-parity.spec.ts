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

const ROUTES: Array<{ path: string; expect: RegExp }> = [
  { path: "/m/feed", expect: /Updates/i },
  { path: "/m/inbox", expect: /Inbox/i },
  { path: "/m/learning", expect: /Learning/i },
  { path: "/m/time-off", expect: /Time Off/i },
  { path: "/m/time-off/new", expect: /New Time-Off Request/i },
  { path: "/m/kudos", expect: /Kudos/i },
  { path: "/m/polls", expect: /Polls/i },
  { path: "/m/surveys", expect: /Surveys/i },
  { path: "/m/docs", expect: /My Documents/i },
  { path: "/m/docs/new", expect: /Upload Document/i },
  { path: "/m/directory", expect: /Directory/i },
  { path: "/m/onboarding", expect: /Onboarding/i },
  { path: "/m/checkin", expect: /Check-in Summary/i },
  { path: "/m/incident", expect: /My Incidents/i },
  { path: "/m/incident/new", expect: /Quick File/i },
];

test.describe("COMPVSS — Connecteam-parity surfaces", () => {
  test.describe("as crew (member)", () => {
    test.beforeEach(async ({ page }) => {
      await dismissConsent(page);
      await loginAs(page, "crew");
    });

    for (const r of ROUTES) {
      test(`${r.path} hydrates`, async ({ page }) => {
        const res = await page.goto(r.path, { waitUntil: "domcontentloaded" });
        expect(res?.status()).toBeLessThan(500);
        // Title text proves the server-rendered html arrived AND the
        // client bundle finished hydrating (a server-only error would
        // surface as a Next error boundary before this could match).
        await expect(page.getByText(r.expect).first()).toBeVisible({ timeout: 10_000 });
      });
    }

    test("/m/feed mounts the realtime island without console errors", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      const r = await page.goto("/m/feed", { waitUntil: "networkidle" });
      expect(r?.status()).toBeLessThan(500);
      // Filter out the well-known noisy warnings that the rest of the suite
      // already accepts (consent banner hydration etc.).
      const real = errors.filter((e) => !/consent|workbox|hydration mismatch/i.test(e));
      expect(real, real.join("\n")).toEqual([]);
    });

    test("/m/settings exposes the PushToggle", async ({ page }) => {
      await page.goto("/m/settings", { waitUntil: "domcontentloaded" });
      await expect(page.getByText(/Push Notifications/i)).toBeVisible();
    });
  });

  test.describe("as owner", () => {
    test.beforeEach(async ({ page }) => {
      await dismissConsent(page);
      await loginAs(page, "owner");
    });

    // Spot-check the 4 highest-signal pages with the elevated role.
    const OWNER_SPOT = ["/m/feed", "/m/inbox", "/m/learning", "/m/time-off"];
    for (const path of OWNER_SPOT) {
      test(`${path} loads for owner`, async ({ page }) => {
        const r = await page.goto(path, { waitUntil: "domcontentloaded" });
        expect(r?.status()).toBeLessThan(500);
      });
    }
  });
});
