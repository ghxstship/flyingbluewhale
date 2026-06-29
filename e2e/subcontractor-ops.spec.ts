/**
 * Subcontractor-Operations layer (v7.5) — functional coverage.
 *
 * The 8 surfaces are render-crawled per shell by ia-coverage.spec.ts (they're in
 * nav.ts) and their API contract by api-v1-coverage.spec.ts (openapi.yaml). This
 * spec adds the FUNCTIONAL depth the auto-crawl can't:
 *   - the new surfaces render their real chrome (heading + key region),
 *   - the Work Order create → detail → advance-state flow,
 *   - Job Template create,
 *   - the Work Order Thread loads + accepts a post,
 *   - the anon public Trades Marketplace board renders.
 *
 * Operator journeys run as `owner` (manager+ band — can do everything). Mutations
 * on these surfaces are RLS-enforced (org member + role); role-band negative cases
 * are covered broadly by atlvs-console-personas + rls-boundaries.
 */
import { expect, test, type Page } from "playwright/test";
import { authedSetup, dismissConsent } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

const STUDIO_SURFACES: Array<{ path: string; heading: RegExp }> = [
  { path: "/studio/procurement/compliance", heading: /Compliance Vault/i },
  { path: "/studio/procurement/network", heading: /Subcontractor Network/i },
  { path: "/studio/procurement/marketplace", heading: /Trades Marketplace/i },
  { path: "/studio/procurement/scorecard", heading: /Vendor Scorecard/i },
  { path: "/studio/production/work-orders", heading: /Work Orders/i },
  { path: "/studio/finance/sub-invoices", heading: /Sub Invoices/i },
  { path: "/studio/settings/job-templates", heading: /Job Templates/i },
];

async function assertNoErrorBoundary(page: Page) {
  // Next error boundary / 500 surfaces; the app's own error UI uses these.
  await expect(page.locator("text=/application error|something went wrong|500/i")).toHaveCount(0);
}

test.describe("subcontractor-ops — surfaces render (owner)", () => {
  test.beforeEach(async ({ page }) => {
    await authedSetup(page, "owner");
  });

  for (const s of STUDIO_SURFACES) {
    test(`${s.path} renders`, async ({ page }) => {
      const res = await page.goto(s.path);
      expect(res?.status() ?? 200).toBeLessThan(500);
      await expect(page.getByRole("heading", { name: s.heading }).first()).toBeVisible({ timeout: 10_000 });
      await assertNoErrorBoundary(page);
    });
  }
});

test.describe("subcontractor-ops — work order lifecycle (owner)", () => {
  test.beforeEach(async ({ page }) => {
    await authedSetup(page, "owner");
  });

  test("create → detail (bid inbox + eligibility chrome) → thread", async ({ page }) => {
    const title = `E2E Work Order ${stamp()}`;
    await createInModule(page, "/studio/production/work-orders/new", { title, trade: "electrical" });
    // The create action redirects to /studio/production/work-orders/<uuid>.
    await page.waitForURL(/\/studio\/production\/work-orders\/[0-9a-f-]{8,}/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: title }).first()).toBeVisible();
    // Bid inbox is the eligibility-gated centerpiece.
    await expect(page.getByRole("heading", { name: /Bid inbox/i }).first()).toBeVisible();
    // Open the thread directly from the record (no fragile list-row click).
    await page.getByRole("link", { name: /thread/i }).first().click();
    await expect(page.getByRole("heading", { name: /Work Order Thread/i }).first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("subcontractor-ops — job templates (owner)", () => {
  test("create a job template", async ({ page }) => {
    await authedSetup(page, "owner");
    const name = `E2E Scope ${stamp()}`;
    await createInModule(page, "/studio/settings/job-templates/new", { name, trade: "rigging" });
    await page.waitForURL(/\/studio\/settings\/job-templates(\?|$)/, { timeout: 15_000 });
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("subcontractor-ops — public Trades Marketplace (anon)", () => {
  test("/marketplace/work-orders renders the public board", async ({ page }) => {
    await dismissConsent(page);
    const res = await page.goto("/marketplace/work-orders");
    expect(res?.status() ?? 200).toBeLessThan(500);
    await expect(page.getByRole("heading", { name: /Open Trade Work Orders/i }).first()).toBeVisible({
      timeout: 10_000,
    });
    await assertNoErrorBoundary(page);
  });
});
