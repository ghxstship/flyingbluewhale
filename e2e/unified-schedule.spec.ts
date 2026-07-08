/**
 * Unified Schedule (CP·3/CP·4) — the operational timeline at
 * /studio/operations/schedule (promoted from the read-only Dispatch Matrix).
 *
 * Behavioral coverage the generic nav crawl (ia-coverage / ia-coverage-roles)
 * can't assert: the dispatch→schedule 301, the query-param lens deep-links
 * (lane/kind/day/state), the writable "New Activity" composer, and cross-role
 * operator access (owner + manager). Deliberately NON-MUTATING so it is safe to
 * run against the live production deployment — it never creates an activity, it
 * only proves the surface renders, redirects, and exposes its write affordance.
 *
 * Crew write-access to the schedule store is covered at the RLS layer by
 * src/lib/schedule-rls-crew-canon.test.ts (crew lands in /m, not /studio, so
 * there is no operator-shell surface to assert here).
 */
import { expect, test } from "./helpers/base";
import { authedSetup } from "./helpers/auth";

const SCHEDULE = "/studio/operations/schedule";

test.describe("Unified Schedule · owner", () => {
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("renders the operational timeline in the ATLVS shell", async ({ page }) => {
    const res = await page.goto(SCHEDULE);
    expect(res?.status(), "schedule surface must not 5xx").toBeLessThan(500);
    await expect(page.locator('[data-platform="atlvs"]').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("heading", { name: /schedule/i }).first()).toBeVisible();
    // The lane grid header column is the timeline's structural anchor.
    await expect(page.getByText(/^Lane$/i).first()).toBeVisible();
  });

  test("Dispatch Matrix 301s to the unified schedule (fleet/crew lens)", async ({ page }) => {
    await page.goto("/studio/operations/dispatch");
    await page.waitForURL((u) => u.toString().includes("/operations/schedule"), { timeout: 20_000 });
    expect(page.url()).toContain("/operations/schedule");
    expect(page.url()).toMatch(/lane=vehicle/);
  });

  test("query-param lens deep-links resolve without crashing", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const lenses = [
      `${SCHEDULE}?lane=crew&kind=shift`,
      `${SCHEDULE}?lane=vehicle,crew`,
      `${SCHEDULE}?kind=rehearsal,sound_check,changeover`,
      `${SCHEDULE}?lane=warehouse&kind=maintenance`,
      `${SCHEDULE}?lane=venue&kind=reservation`,
      `${SCHEDULE}?day=2030-01-15`,
    ];
    for (const url of lenses) {
      const res = await page.goto(url);
      expect(res?.status(), `${url} must not 5xx`).toBeLessThan(500);
      await expect(page.getByRole("heading", { name: /schedule/i }).first()).toBeVisible();
    }
    const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("404"));
    expect(fatal, "no lens deep-link may crash the render").toEqual([]);
  });

  test("New Activity composer opens with the guardrailed form fields", async ({ page }) => {
    await page.goto(SCHEDULE);
    await page.getByRole("button", { name: /new activity/i }).click();
    // Dialog + its core fields (name + kind + start/end) prove the writable path.
    await expect(page.getByRole("heading", { name: /new activity/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("textbox", { name: /^name$/i })).toBeVisible();
    await expect(page.locator('select[name="activity_kind"]')).toBeVisible();
    await expect(page.locator('input[name="starts_at"]')).toBeVisible();
    await expect(page.locator('input[name="ends_at"]')).toBeVisible();
  });
});

test.describe("Unified Schedule · manager", () => {
  test.beforeEach(async ({ page }) => authedSetup(page, "manager"));

  test("manager reaches the schedule surface (no RBAC crash)", async ({ page }) => {
    const res = await page.goto(SCHEDULE);
    expect(res?.status()).toBeLessThan(500);
    await expect(page.getByRole("heading", { name: /schedule/i }).first()).toBeVisible({ timeout: 10_000 });
  });
});
