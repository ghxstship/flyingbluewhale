/**
 * Tour Management (kit 26) — the touring layer end-to-end.
 *
 * A tour is a routed run of dates for a rostered artist, expressed as a SCOPE
 * across the canonical stores — never a silo. This spec guards the two new
 * surfaces (Tours cockpit + Routing lens, Day Sheets), the day-sheet publish
 * lifecycle, the Casting merge, and the Finance Tour Settlement lens at RUNTIME.
 *
 * The IA *structure* (Talent rail = 4 items, Casting merges Submissions, Tours
 * promoted, no tab-family mirror, Tour Settlement lens present) is asserted
 * deterministically in the unit guard `src/lib/nav-tour-management.test.ts` —
 * that's the right home for shape, so this spec only exercises rendering + flow.
 *
 * NOT to be confused with `console-tour.spec.ts` — that is the product ONBOARDING
 * walkthrough (spotlight tour), a false friend.
 */
import { expect, test } from "./helpers/base";
import { authedSetup } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

test.describe("Tour Management (owner)", () => {
  test.beforeEach(async ({ page }) => {
    // Suppress the first-run product-onboarding spotlight (ConsoleTour) — its
    // full-viewport scrim (z-[var(--p-z-tour)]) intercepts clicks. Seed the
    // "seen" flag (src/lib/help/console-tour.ts) before any page script runs.
    // Unrelated to tour MANAGEMENT.
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("atlvs.tour.console.v1", "done");
      } catch {
        /* storage unavailable — harmless */
      }
    });
    await authedSetup(page, "owner");
  });

  test("Tours cockpit renders the Routing tab and the Routing lens loads", async ({ page }) => {
    await page.goto("/studio/agency/tours");
    await expect(page.getByRole("heading", { name: "Tours", exact: true }).first()).toBeVisible({ timeout: 15_000 });
    // The auto-tab shelf carries the Routing lens (href-based: robust to label
    // nuance). Its presence proves the Tours tab family wired, not the mirror.
    await expect(page.locator('a[href="/studio/agency/tours/routing"]').first()).toBeVisible();

    await page.goto("/studio/agency/tours/routing");
    await expect(page.getByRole("heading", { name: "Routing", exact: true }).first()).toBeVisible({ timeout: 15_000 });
  });

  test("Casting merged Submissions: both the Calls tab and Submissions route resolve", async ({ page }) => {
    await page.goto("/studio/marketplace/calls");
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
    // Submissions is now a Casting tab, not a standalone rail item — assert the
    // tab is wired and the route still resolves (no dead route from the merge).
    await expect(page.locator('a[href="/studio/marketplace/submissions"]').first()).toBeVisible();
    await page.goto("/studio/marketplace/submissions");
    await expect(page.locator("main")).toBeVisible();
  });

  test("Finance · Budgets carries the Tour Settlement lens", async ({ page }) => {
    await page.goto("/studio/finance/wip?scope=tour");
    await expect(page.getByRole("heading", { name: "Tour Settlement", exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("Day Sheets: list renders, then create → publish to the field", async ({ page }) => {
    await page.goto("/studio/operations/day-sheets");
    await expect(page.getByRole("heading", { name: "Day Sheets", exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });

    const city = `E2E Nashville ${stamp()}`;
    await createInModule(page, "/studio/operations/day-sheets/new", {
      city,
      sheet_date: "2030-08-18",
      venue: "Ascend Amphitheater",
      doors: "18:30",
      curfew: "23:00",
    });
    // Landed on the composed detail page in the initial state.
    await expect(page.getByRole("heading", { name: city, exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Not Started", { exact: true }).first()).toBeVisible();

    // Walk the publish lifecycle: Not Started → Draft → Published.
    await page.getByRole("button", { name: /Move To Draft/i }).click();
    await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Publish To Field/i }).click();
    await expect(page.getByText("Published", { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  });
});
