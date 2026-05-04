import { expect, test, type Page } from "playwright/test";

/**
 * forms-render-smoke
 *
 * Visits every /new route in the platform console and asserts the form page
 * renders without error, with the expected canonical elements (a `<form>`,
 * a submit button, and either a Cancel link or breadcrumb back-link).
 *
 * This is render-level smoke, not mutation testing — see
 * forms-construction-trade.spec.ts for full create→read→edit lifecycle on
 * the canonical resources.
 *
 * Why smoke first: 78 /new routes is too many to deep-test exhaustively in
 * one suite. A render smoke catches the most common regressions (broken
 * imports, missing dependencies, RSC boundary errors, server action import
 * failures) for ~5 minutes of test time vs hours for full CRUD lifecycle
 * on every module.
 */

const PASSWORD = "FlyingBlue!Test2026";
const OWNER_EMAIL = "test+owner@flyingbluewhale.app";

async function dismissConsent(page: Page) {
  await page.context().addCookies([
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
}

async function login(page: Page) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(OWNER_EMAIL);
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 10000 });
}

// Every /new route in src/app/(platform)/console at audit time. Update when
// adding new modules — `find src/app/\(platform\) -name 'page.tsx' -path '*/new/*'`
// regenerates the list.
const NEW_ROUTES: string[] = [
  "/console/accommodation/blocks/new",
  "/console/accreditation/categories/new",
  "/console/accreditation/changes/new",
  "/console/ai/automations/new",
  "/console/campaigns/new",
  "/console/clients/new",
  "/console/commercial/sponsors/new",
  "/console/commercial/tickets/new",
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
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await login(page);
  });

  for (const route of NEW_ROUTES) {
    test(`${route} renders without error`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      // Page should resolve — 200, or 302 (redirect for non-permitted role, also fine)
      expect(response?.status()).toBeLessThan(400);

      // If we did land on the route (no redirect), require a form + submit button
      if (page.url().includes(route)) {
        await expect(page.locator("form").first()).toBeVisible({ timeout: 5000 });
        await expect(
          page
            .getByRole("button", { name: /create|save|submit|publish|add|open|new|set up|generate|publish/i })
            .first(),
        ).toBeVisible({ timeout: 5000 });
      }
    });
  }
});
