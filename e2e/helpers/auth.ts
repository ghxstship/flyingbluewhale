/**
 * Shared e2e auth + consent helpers.
 *
 * Every spec used to redeclare `dismissConsent()` and `loginAs<Role>()`
 * locally with identical bodies — 19 copies across the suite. This file
 * is the single source of truth.
 *
 * Why a hand-rolled login instead of Playwright's storageState?
 *   The seeded fixture password rotates per CI run; storageState would
 *   bake in a cookie that goes stale. The form-flow keeps every spec
 *   independent of fixture-cycle timing.
 *
 * Login resilience:
 *   The first /login + /console hit on a cold dev server takes 10–25s
 *   for Turbopack to compile the route graph. The 25s navigation
 *   timeout below absorbs that on CI's first retry. Subsequent calls
 *   in the same worker are sub-second.
 */
import type { Page } from "playwright/test";

/** Canonical fixture password for every test+<role>@flyingbluewhale.app user. */
export const TEST_PASSWORD = "FlyingBlue!Test2026";

/** Canonical fixture email pattern. */
export function fixtureEmail(role: string): string {
  return `test+${role}@flyingbluewhale.app`;
}

/**
/**
 * Suppress the first-run ConsoleTour overlay (a full-viewport scrim,
 * z-[var(--p-z-tour)], that intercepts clicks on the /studio shell). Uses
 * addInitScript so the flag is set on every navigation in this context,
 * including /login. Call in a file-scoped `test.beforeEach` (runs before
 * describe-scoped hooks) so it lands before the first `page.goto`. Do NOT
 * fold this into `dismissConsent` — `console-tour.spec.ts` needs the tour
 * to actually appear.
 */
export async function suppressTour(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("atlvs.tour.console.v1", "done");
    } catch {
      /* storage may be unavailable pre-navigation; the goto retries it */
    }
  });
}

/**
 * Set the consent cookie so the cookie banner doesn't intercept clicks.
 * Essential-only, no analytics or marketing — the test always opts in
 * to the minimum. Run before `page.goto()` calls.
 */
export async function dismissConsent(page: Page): Promise<void> {
  // Pre-set the consent cookie so the CookieConsent dialog (a fixed inset-0
  // backdrop scrim) never renders and intercepts clicks. Scope it to the
  // current target via `url` (NOT a hardcoded localhost domain) so it works
  // both locally AND when the suite runs against a deployed target through
  // E2E_BASE_URL (e.g. https://atlvs.pro) — otherwise the scrim swallows every
  // click on prod and click-based tests time out.
  const base = process.env.E2E_BASE_URL || "http://localhost:3000";
  await page.context().addCookies([
    {
      // Canonical consent cookie after the brand sweep (legacy fbw_consent is
      // read-only) — see COOKIE_NAME in src/components/compliance/CookieConsent.tsx.
      name: "atlvs_consent",
      value: encodeURIComponent(
        JSON.stringify({
          essential: true,
          analytics: false,
          marketing: false,
          decidedAt: new Date().toISOString(),
        }),
      ),
      url: base,
    },
  ]);
}

/**
 * Sign in as a seeded test user. Returns once the post-login redirect
 * has settled (i.e. the URL no longer matches /login).
 *
 * @param page  Playwright page in the desired context.
 * @param role  Role suffix used in the seeded email — owner, admin,
 *              manager, member, crew, client, contractor, etc.
 */
export async function loginAs(page: Page, role: string): Promise<void> {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(fixtureEmail(role));
  await page.getByRole("textbox", { name: "Password" }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  // 45s: the /auth/resolve redirect can stall well past 25s when a long serial
  // run keeps the dev server recompiling heavy routes between tests — the 25s
  // budget produced cascade beforeEach failures in the deep-coverage suites.
  await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 45000 });
  // Settle the post-login navigation BEFORE returning. `waitForURL` resolves the
  // instant the URL changes — but the destination page is still loading (and, on
  // the real prod domain, the proxy middleware is still refreshing the session
  // cookie). If a test fires `page.goto(...)` while that nav is in flight, the new
  // navigation aborts the in-flight one → net::ERR_ABORTED (the dominant source of
  // remote-target flakiness). Waiting for the load event closes that race.
  await page.waitForLoadState("load").catch(() => {});
}

/**
 * Convenience: dismiss consent + log in as `role` in one call. Use this
 * inside `test.beforeEach` so every test starts in a known authed state.
 */
export async function authedSetup(page: Page, role: string): Promise<void> {
  await dismissConsent(page);
  await loginAs(page, role);
}

/**
 * Sign in as `role` AND switch the active workspace to `orgId` via
 * PATCH /api/v1/me/workspaces. Required by spec families that exercise
 * a non-default tenant (e.g. booking-canon, marketplace-canon-actions —
 * the seeded fixture user belongs to multiple orgs and the default
 * workspace isn't the one those tests target).
 *
 * Throws if the workspace switch returns a non-200 — that's a real seed
 * problem, not a transient flake, and silently continuing would let the
 * tests run against the wrong tenant.
 */
export async function loginAndSwitchWorkspace(page: Page, role: string, orgId: string): Promise<void> {
  await loginAs(page, role);
  const r = await page.request.patch("/api/v1/me/workspaces", { data: { orgId } });
  if (r.status() !== 200) {
    throw new Error(`workspace switch to ${orgId} failed: ${r.status()} ${await r.text()}`);
  }
}
