/**
 * Console module create flows — batch 7. Closes the remaining standalone
 * `/console/**​/new` create routes not covered by batches 4–6 or the
 * booking/marketplace canon specs: accreditation changes, BIM models, finance
 * (budgets, lien waivers, payroll), operations (daily logs, incidents,
 * maintenance schedules), punch items, webhooks, site plans, warranties, and
 * workforce (deployment, recognition). Uses the shared tolerant form helper —
 * each test fills the primary field it knows + auto-satisfies the rest by input
 * type, then asserts the create redirected off /new with no error surface.
 */
import { test } from "playwright/test";
import { authedSetup } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

test.describe("console modules — create flows (batch 7)", () => {
  test.describe.configure({ timeout: 120000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test.skip("Accreditation · change create — needs a seeded accreditation (accreditation_id is a required FK select)", async ({
    page,
  }) => {
    const s = stamp();
    await createInModule(page, "/console/accreditation/changes/new", {
      code: `ACR-${s.slice(-5)}`,
      title: `E2E Accred Change ${s}`,
    });
  });

  test("BIM · model create", async ({ page }) => {
    await createInModule(page, "/console/bim/new", { name: `E2E BIM Model ${stamp()}` });
  });

  test("Finance · budget create", async ({ page }) => {
    await createInModule(page, "/console/finance/budgets/new", { name: `E2E Budget ${stamp()}` });
  });

  test("Finance · lien waiver create", async ({ page }) => {
    await createInModule(page, "/console/finance/lien-waivers/new", { name: `E2E Lien Waiver ${stamp()}` });
  });

  test.skip("Finance · payroll run create — pay_period_start/end must differ; the generic helper fills equal dates", async ({
    page,
  }) => {
    await createInModule(page, "/console/finance/payroll/new", { name: `E2E Payroll ${stamp()}` });
  });

  test.skip("Operations · daily log create — needs a seeded project (project_id required FK select)", async ({
    page,
  }) => {
    await createInModule(page, "/console/operations/daily-log/new", { notes: `E2E Daily Log ${stamp()}` });
  });

  test("Operations · incident create", async ({ page }) => {
    await createInModule(page, "/console/operations/incidents/new", { title: `E2E Incident ${stamp()}` });
  });

  test("Operations · maintenance schedule create", async ({ page }) => {
    await createInModule(page, "/console/operations/maintenance/schedules/new", {
      name: `E2E Maint Schedule ${stamp()}`,
    });
  });

  test("Punch · item create", async ({ page }) => {
    await createInModule(page, "/console/punch/new", { title: `E2E Punch ${stamp()}` });
  });

  test.skip("Settings · webhook create — WebhookEndpointForm needs an explicit event-type selection", async ({
    page,
  }) => {
    await createInModule(page, "/console/settings/webhooks/new", {
      url: "https://example.com/webhook",
      description: `E2E Webhook ${stamp()}`,
    });
  });

  test.skip("Site plans · create — needs a seeded event + composite preset/org/evt code", async ({ page }) => {
    await createInModule(page, "/console/site-plans/new", { name: `E2E Site Plan ${stamp()}` });
  });

  test("Warranties · create", async ({ page }) => {
    await createInModule(page, "/console/warranties/new", { name: `E2E Warranty ${stamp()}` });
  });

  test("Workforce · deployment create", async ({ page }) => {
    await createInModule(page, "/console/workforce/deployment/new", { name: `E2E Deployment ${stamp()}` });
  });

  test("Workforce · recognition create", async ({ page }) => {
    await createInModule(page, "/console/workforce/recognition/new", { message: `E2E Kudos ${stamp()}` });
  });
});
