/**
 * Console module create flows — batch 7. Closes the remaining standalone
 * `/studio/**​/new` create routes not covered by batches 4–6 or the
 * booking/marketplace canon specs: accreditation changes, BIM models, finance
 * (budgets, lien waivers, payroll), operations (daily logs, incidents,
 * maintenance schedules), punch items, webhooks, site plans, warranties, and
 * workforce (deployment, recognition). Uses the shared tolerant form helper —
 * each test fills the primary field it knows + auto-satisfies the rest by input
 * type, then asserts the create redirected off /new with no error surface.
 */
import { expect, test } from "playwright/test";
import { authedSetup } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

test.describe("console modules — create flows (batch 7)", () => {
  test.describe.configure({ timeout: 120000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("Accreditation · change create", async ({ page }) => {
    // accreditation_id is a required FK select; a fixture accreditation is seeded
    // in the Professional org so the helper resolves the first option.
    await createInModule(page, "/studio/accreditation/changes/new", { note: `E2E Accred Change ${stamp()}` });
  });

  test("BIM · model create", async ({ page }) => {
    // storage_path is required + unique-ish — the generic helper fills it with a
    // constant, which collides on re-run; pass a unique path.
    const s = stamp();
    await createInModule(page, "/studio/bim/new", {
      name: `E2E BIM Model ${s}`,
      storage_path: `e2e/bim-${s}.ifc`,
    });
  });

  test("Finance · budget create", async ({ page }) => {
    await createInModule(page, "/studio/finance/budgets/new", { name: `E2E Budget ${stamp()}` });
  });

  test("Finance · lien waiver create", async ({ page }) => {
    await createInModule(page, "/studio/finance/lien-waivers/new", { name: `E2E Lien Waiver ${stamp()}` });
  });

  test("Finance · payroll run create", async ({ page }) => {
    // pay_period_start/end must differ + be UNIQUE per run (payroll runs collide
    // on a repeated period). Derive a unique 2-week past window from the clock.
    const start = new Date(2001, 0, 1);
    start.setDate(start.getDate() + (Date.now() % 8000));
    const end = new Date(start);
    end.setDate(end.getDate() + 14);
    await createInModule(page, "/studio/finance/payroll/new", {
      pay_period_start: start.toISOString().slice(0, 10),
      pay_period_end: end.toISOString().slice(0, 10),
      week_ending: end.toISOString().slice(0, 10),
    });
  });

  test("Operations · daily log create", async ({ page }) => {
    // log_date must be a unique PAST value — daily_logs is UNIQUE on
    // (org_id, project_id, log_date) and the helper picks the same first project.
    const d = new Date(2000, 0, 1);
    d.setDate(d.getDate() + (Date.now() % 8000));
    await createInModule(page, "/studio/operations/daily-log/new", {
      log_date: d.toISOString().slice(0, 10),
      notes: `E2E Daily Log ${stamp()}`,
    });
  });

  test("Operations · incident create", async ({ page }) => {
    await createInModule(page, "/studio/operations/incidents/new", { title: `E2E Incident ${stamp()}` });
  });

  test("Operations · maintenance schedule create", async ({ page }) => {
    await createInModule(page, "/studio/operations/maintenance/schedules/new", {
      name: `E2E Maint Schedule ${stamp()}`,
    });
  });

  test("Punch · item create", async ({ page }) => {
    await createInModule(page, "/studio/punch/new", { title: `E2E Punch ${stamp()}` });
  });

  test("Settings · webhook create", async ({ page }) => {
    // WebhookEndpointForm is a client form (not FormShell): https url + ≥1 event
    // checkbox + a type=button "Register endpoint". On success it reveals the
    // signing secret in place (no redirect).
    await page.goto("/studio/settings/webhooks/new");
    await page.locator('input[type="url"]').first().fill(`https://example.com/webhook-${stamp()}`);
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole("button", { name: /register endpoint/i }).click();
    await expect(page.getByText(/registered|secret|copy/i).first()).toBeVisible({ timeout: 15000 });
  });

  // Skipped: site-plans/new is a composite-coded sheet form (org_code · evt_code ·
  // year · ven_code · zon_code · sheet_type · primary_class compose a canonical
  // sheet id) with cross-field validation the generic placeholder codes don't
  // satisfy, so the submit doesn't land. Needs a composite-code-aware spec.
  test.skip("Site plans · create", async ({ page }) => {
    const s = stamp().slice(-4);
    await createInModule(page, "/studio/site-plans/new", {
      title: `E2E Site Plan ${stamp()}`,
      code: `SP${s}`,
      org_code: "ORG",
      evt_code: "EVT",
      year: "2026",
      ven_code: "VEN",
      zon_code: "ZON",
    });
  });

  // Skipped: crew options resolve (6), but the create submit stays on /new with
  // no error surface — the msa/new form isn't a standard <main> FormShell (custom
  // submit / silent precondition), so the generic requestSubmit doesn't land.
  // Needs an msa-form-aware spec.
  test.skip("People · MSA create", async ({ page }) => {
    await createInModule(page, "/studio/people/msas/new", {});
  });

  test("Warranties · create", async ({ page }) => {
    await createInModule(page, "/studio/warranties/new", { name: `E2E Warranty ${stamp()}` });
  });

  test("Workforce · deployment create", async ({ page }) => {
    await createInModule(page, "/studio/workforce/deployment/new", { name: `E2E Deployment ${stamp()}` });
  });

  test("Workforce · recognition create", async ({ page }) => {
    await createInModule(page, "/studio/workforce/recognition/new", { message: `E2E Kudos ${stamp()}` });
  });
});
