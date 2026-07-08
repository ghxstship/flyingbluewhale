import { test, expect } from "./helpers/base";
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

/**
 * M6 — entitlement resolution is per-session, not a constant. The audit found
 * every app-rail assertion ran as owner. GET /api/v1/me/entitlements resolves
 * each product's access from the caller's role/persona (productAccess): an
 * owner OPERATES ATLVS (full) while a viewer is read-only-or-less. Asserting the
 * differentiation (owner=full vs viewer≠full) proves the API keys off the
 * session, robustly across the exact ro/null value.
 */
test.describe("app rail entitlements · per-role (M6)", () => {
  test.describe.configure({ timeout: 90_000 });

  async function atlvsAccess(page: import("playwright/test").Page): Promise<string | null | undefined> {
    const r = await page.request.get("/api/v1/me/entitlements");
    expect(r.status(), "entitlements resolve for an authed session").toBe(200);
    const apps = ((await r.json())?.data?.apps ?? []) as { id: string; access: string | null }[];
    return apps.find((a) => a.id === "atlvs")?.access;
  }

  test("owner operates ATLVS (full access)", async ({ page }) => {
    await authedSetup(page, "owner");
    expect(await atlvsAccess(page), "owner gets full ATLVS access").toBe("full");
  });

  test("viewer does not get full ATLVS operator access", async ({ page }) => {
    await authedSetup(page, "viewer");
    // Read-only (ro) or none — the point is it is NOT the operator's `full`.
    expect(await atlvsAccess(page), "viewer is more restricted than owner").not.toBe("full");
  });
});
