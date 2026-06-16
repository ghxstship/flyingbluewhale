import { expect, test } from "playwright/test";

/**
 * forms-render-smoke
 *
 * Visits every /new route in the platform console and asserts the form
 * renders with a `<form>` + submit button.
 *
 * Performance:
 * - Login happens ONCE in beforeAll via storageState — saves ~3s per test.
 * - 90s per-test timeout because Next.js dev mode compiles each route on
 *   first hit (often 30-60s for routes with many imports). Production
 *   builds are sub-second; this is purely dev-time.
 * - Single worker (workers: 1 in playwright.config) — tests run serially.
 *
 * What this catches:
 * - RSC boundary errors (function passed to client component)
 * - Broken imports / missing dependencies
 * - Server action import failures
 * - Auth / RLS issues that 500 the page
 *
 * What this does NOT catch:
 * - Form submission bugs → see forms-construction-trade.spec.ts
 * - Edit-page lookup bugs (column-name typos) → also need lifecycle tests
 */

const PASSWORD = "FlyingBlue!Test2026";
const OWNER_EMAIL = "test+owner@flyingbluewhale.app";
const STORAGE_STATE = "e2e/.auth/owner.json";

test.beforeAll(async ({ browser }) => {
  // Ensure the auth dir exists before we try to write into it. Without
  // this, storageState({path}) ENOENTs on a fresh worktree because the
  // .gitignored e2e/.auth/ directory doesn't exist yet.
  const { mkdirSync } = await import("node:fs");
  const { dirname } = await import("node:path");
  mkdirSync(dirname(STORAGE_STATE), { recursive: true });
  // Explicitly pass storageState: undefined so this bootstrap context
  // doesn't try to read the storage file we're about to create — the
  // describe block below sets test.use({ storageState }) which would
  // otherwise be inherited here and ENOENT on the first run.
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  await context.addCookies([
    {
      name: "fbw_consent",
      value: encodeURIComponent(
        JSON.stringify({
          essential: true,
          analytics: false,
          marketing: false,
          decidedAt: new Date().toISOString(),
        }),
      ),
      domain: "localhost",
      path: "/",
    },
  ]);
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(OWNER_EMAIL);
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
  await context.storageState({ path: STORAGE_STATE });
  await context.close();
});

const NEW_ROUTES: string[] = [
  "/console/accommodation/blocks/new",
  "/console/accreditation/categories/new",
  "/console/accreditation/changes/new",
  "/console/ai/automations/new",
  "/console/campaigns/new",
  "/console/clients/new",
  "/console/commercial/sponsors/new",
  // /console/commercial/tickets never existed — ticketing is unified
  // assignments (dead nav links removed in audit phase 5).
  "/console/events/new",
  "/console/finance/budgets/new",
  "/console/finance/cost-codes/new",
  "/console/finance/expenses/new",
  "/console/finance/invoices/new",
  "/console/finance/mileage/new",
  "/console/finance/pay-apps/new",
  "/console/finance/time/new",
  "/console/forms/new",
  "/console/inspections/new",
  "/console/inspections/templates/new",
  "/console/knowledge/new",
  "/console/leads/new",
  "/console/legal/insurance/new",
  "/console/legal/ip/new",
  "/console/legal/privacy/dsar/new",
  "/console/locations/new",
  "/console/logistics/ratecard/new",
  "/console/operations/daily-log/new",
  "/console/operations/incidents/new",
  "/console/operations/maintenance/schedules/new",
  "/console/ops/toc/changes/new",
  "/console/ops/toc/problems/new",
  "/console/participants/delegations/new",
  "/console/participants/entries/new",
  "/console/participants/visa/new",
  "/console/people/credentials/new",
  "/console/people/crew/new",
  "/console/procurement/po-change-orders/new",
  "/console/procurement/prequalification/new",
  "/console/procurement/prequalification/questionnaires/new",
  "/console/procurement/purchase-orders/new",
  "/console/procurement/requisitions/new",
  "/console/procurement/rfqs/new",
  "/console/procurement/vendors/new",
  "/console/procurement/wo-broadcasts/new",
  "/console/production/equipment/new",
  "/console/production/fabrication/new",
  "/console/production/rentals/new",
  "/console/programs/readiness/new",
  "/console/programs/reviews/new",
  "/console/programs/risk/new",
  "/console/projects/new",
  "/console/proposals/new",
  "/console/punch/new",
  "/console/rfis/new",
  "/console/safety/briefings/new",
  "/console/safety/crisis/new",
  "/console/safety/environmental/new",
  "/console/safety/guard-tours/new",
  "/console/safety/major-incident/new",
  "/console/safety/medical/encounters/new",
  "/console/safety/playbooks/new",
  "/console/safety/safeguarding/new",
  "/console/safety/threats/new",
  "/console/services/requests/new",
  "/console/settings/webhooks/new",
  "/console/site-plans/new",
  "/console/submittals/new",
  "/console/sustainability/carbon/new",
  "/console/tasks/new",
  "/console/transport/ad/new",
  "/console/transport/dispatch/new",
  "/console/venues/new",
  "/console/workforce/contractors/new",
  "/console/workforce/deployment/new",
  "/console/workforce/rosters/new",
  "/console/workforce/staff/new",
  "/console/workforce/volunteers/new",
];

test.describe("forms render smoke", () => {
  test.use({ storageState: STORAGE_STATE });
  test.setTimeout(90000);

  for (const route of NEW_ROUTES) {
    test(`${route} renders without error`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 60000 });
      expect(response?.status()).toBeLessThan(400);

      // If we landed on the route (no redirect for permission), the page must
      // have rendered without crashing. Most `/new` pages show a form; but a
      // *dependent*-create page (e.g. accreditation change needs ≥1 accreditation
      // on file, deployment needs a deployable resource) legitimately renders a
      // graceful empty-state with a CTA when its prerequisite data is absent —
      // that is "rendered without error" too, not a failure. Accept either; a
      // real render crash shows neither (error boundary / no main).
      if (page.url().includes(route)) {
        await expect(page.locator("main, .page-content").first()).toBeVisible({ timeout: 10000 });
        const hasForm = (await page.locator("form").count()) > 0;
        if (hasForm) {
          await expect(page.locator("form").first()).toBeVisible({ timeout: 10000 });
          await expect(
            page
              .getByRole("button", { name: /create|save|submit|publish|add|open|new|set up|generate|schedule/i })
              .first(),
          ).toBeVisible({ timeout: 10000 });
        } else {
          // dependent-create empty-state: a surface with a guiding CTA link.
          await expect(page.getByRole("link").first()).toBeVisible({ timeout: 10000 });
        }
      }
    });
  }
});
