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

  test("Accreditation · change create", async ({ page }) => {
    // accreditation_id is a required FK select; a fixture accreditation is seeded
    // in the Professional org so the helper resolves the first option.
    await createInModule(page, "/console/accreditation/changes/new", { note: `E2E Accred Change ${stamp()}` });
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

  test("Finance · payroll run create", async ({ page }) => {
    // pay_period_start/end must differ + week_ending within range (generic helper
    // would fill them all equal), so pass explicit distinct dates.
    await createInModule(page, "/console/finance/payroll/new", {
      pay_period_start: "2026-05-01",
      pay_period_end: "2026-05-15",
      week_ending: "2026-05-15",
    });
  });

  // Skipped: the required project_id <select> renders 0 options in the test org
  // even though it has 4 projects — the daily-log page applies a project filter
  // (state/eligibility) the seed projects don't satisfy, so there's no project to
  // pick. (log_date also needs a unique past value — daily_logs is UNIQUE on
  // org_id+project_id+log_date — handled, but moot without a project.) Needs a
  // fixture project that matches the daily-log eligibility filter.
  test.skip("Operations · daily log create", async ({ page }) => {
    const d = new Date(2000, 0, 1);
    d.setDate(d.getDate() + (Date.now() % 8000));
    await createInModule(page, "/console/operations/daily-log/new", {
      log_date: d.toISOString().slice(0, 10),
      notes: `E2E Daily Log ${stamp()}`,
    });
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
