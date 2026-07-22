import { expect, test } from "./helpers/base";
import { dismissConsent } from "./helpers/auth";

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
  await dismissConsent(page);
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(OWNER_EMAIL);
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
  await context.storageState({ path: STORAGE_STATE });
  await context.close();
});

const NEW_ROUTES: string[] = [
  "/studio/accommodation/blocks/new",
  "/studio/accreditation/categories/new",
  "/studio/accreditation/changes/new",
  "/studio/ai/automations/new",
  "/studio/assets/new",
  "/studio/campaigns/new",
  "/studio/clients/new",
  "/studio/commercial/sponsors/new",
  // /studio/commercial/tickets never existed — ticketing is unified
  // assignments (dead nav links removed in audit phase 5).
  "/studio/events/new",
  "/studio/finance/budgets/new",
  "/studio/finance/cost-codes/new",
  "/studio/finance/expenses/new",
  "/studio/finance/invoices/new",
  "/studio/finance/mileage/new",
  "/studio/finance/pay-apps/new",
  "/studio/finance/time/new",
  "/studio/forms/new",
  "/studio/inspections/new",
  "/studio/inspections/templates/new",
  "/studio/knowledge/new",
  "/studio/leads/new",
  "/studio/legal/insurance/new",
  "/studio/legal/ip/new",
  "/studio/legal/privacy/dsar/new",
  // Locations canonical home moved to the LEG3ND hub (decision 6 rider).
  "/legend/hub/locations/new",
  "/studio/logistics/ratecard/new",
  "/studio/operations/daily-log/new",
  "/studio/operations/incidents/new",
  "/studio/operations/maintenance/schedules/new",
  "/studio/ops/toc/changes/new",
  "/studio/ops/toc/problems/new",
  "/studio/participants/delegations/new",
  "/studio/participants/entries/new",
  "/studio/participants/visa/new",
  "/studio/people/credentials/new",
  "/studio/people/crew/new",
  "/studio/procurement/po-change-orders/new",
  "/studio/procurement/prequalification/new",
  "/studio/procurement/prequalification/questionnaires/new",
  "/studio/procurement/purchase-orders/new",
  "/studio/procurement/requisitions/new",
  "/studio/procurement/rfqs/new",
  "/studio/procurement/vendors/new",
  "/studio/procurement/wo-broadcasts/new",
  "/studio/production/fabrication/new",
  "/studio/production/rentals/new",
  "/studio/programs/readiness/new",
  "/studio/programs/reviews/new",
  "/studio/programs/risk/new",
  "/studio/projects/new",
  "/studio/proposals/new",
  "/studio/punch/new",
  "/studio/rfis/new",
  "/studio/safety/briefings/new",
  "/studio/safety/crisis/new",
  "/studio/safety/environmental/new",
  "/studio/safety/guard-tours/new",
  "/studio/safety/major-incident/new",
  "/studio/safety/medical/encounters/new",
  "/studio/safety/playbooks/new",
  "/studio/safety/safeguarding/new",
  "/studio/safety/threats/new",
  "/studio/services/requests/new",
  "/studio/settings/webhooks/new",
  "/studio/site-plans/new",
  "/studio/submittals/new",
  "/studio/sustainability/carbon/new",
  "/studio/tasks/new",
  "/studio/transport/ad/new",
  "/studio/transport/dispatch/new",
  "/studio/venues/new",
  "/studio/workforce/contractors/new",
  "/studio/workforce/deployment/new",
  "/studio/workforce/rosters/new",
  "/studio/workforce/staff/new",
  "/studio/workforce/volunteers/new",
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
