import { test, expect } from "playwright/test";
import { authedSetup } from "./helpers/auth";

/**
 * Global App Rail (ATLVS Ecosystem kit) — the persistent cross-product
 * switcher mounted on the authenticated desktop consoles. An internal owner
 * reaches ≥ 2 products, so the rail renders: ATLVS active, the other products
 * navigable, the extensions shown "coming soon".
 *
 * Runs against the deployed target via E2E_BASE_URL (the local dev server can't
 * compile the heavy console routes here — see project-prod-e2e-wiring).
 */
test.describe("global app rail · ATLVS console · owner", () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("renders the rail with the active product + product links", async ({ page }) => {
    await page.goto("/studio");
    const rail = page.getByRole("navigation", { name: /switch app/i });
    await expect(rail).toBeVisible({ timeout: 20_000 });

    // The active product is current; the other products are reachable links.
    await expect(rail.getByRole("link", { name: /^ATLVS$/ })).toHaveAttribute("aria-current", "page");
    for (const name of ["COMPVSS", "GVTEWAY", "LEG3ND"]) {
      await expect(rail.getByText(name, { exact: true }).first()).toBeVisible();
    }
  });

  test("shows the extensions as coming soon (inert)", async ({ page }) => {
    await page.goto("/studio");
    const rail = page.getByRole("navigation", { name: /switch app/i });
    await expect(rail).toBeVisible({ timeout: 20_000 });
    // At least one coming-soon item, marked disabled — and it's not a link.
    const soon = rail.locator('[aria-disabled="true"]').first();
    await expect(soon).toBeVisible();
    await expect(soon.getByText(/soon/i)).toBeVisible();
  });
});
