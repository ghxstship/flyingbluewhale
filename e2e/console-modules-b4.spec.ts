/**
 * Console module create flows — batch 4. Extends console-modules.spec.ts with
 * more single-entity create coverage across accommodation, accreditation, AI,
 * captures, comms surveys, drawings, estimates, finance (entities/forecasts/
 * mileage/periods/time), forms, locations, logistics, ITIL (TOC), participants,
 * people, procurement RFQs, and programs. Uses the shared form helper; each test
 * asserts the create redirected off /new with no error surface.
 */
import { test } from "./helpers/base";
import { authedSetup } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

test.describe("console modules — create flows (batch 4)", () => {
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("Accommodation · room block create", async ({ page }) => {
    await createInModule(page, "/studio/accommodation/blocks/new", { name: `E2E Block ${stamp()}` });
  });

  test("Accreditation · category create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/accreditation/categories/new", {
      code: `E2E${s.slice(-5)}`,
      name: `E2E Cat ${s}`,
    });
  });

  test("AI · automation create", async ({ page }) => {
    await createInModule(page, "/studio/ai/automations/new", { name: `E2E Automation ${stamp()}` });
  });

  test("Reality captures · create", async ({ page }) => {
    await createInModule(page, "/studio/captures/new", { name: `E2E Capture ${stamp()}` });
  });

  test("Comms · survey create", async ({ page }) => {
    await createInModule(page, "/studio/comms/surveys/new", { title: `E2E Survey ${stamp()}` });
  });

  test("Drawings · create", async ({ page }) => {
    await createInModule(page, "/studio/drawings/new", { name: `E2E Drawing ${stamp()}` });
  });

  test("Estimates · create", async ({ page }) => {
    await createInModule(page, "/studio/estimates/new", { name: `E2E Estimate ${stamp()}` });
  });

  test("Finance · entity create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/finance/entities/new", {
      legal_name: `E2E Entity ${s}`,
      short_code: `E${s.slice(-5)}`,
    });
  });

  test("Finance · forecast create", async ({ page }) => {
    await createInModule(page, "/studio/finance/forecasts/new", { name: `E2E Forecast ${stamp()}` });
  });

  test("Finance · mileage log create", async ({ page }) => {
    await createInModule(page, "/studio/finance/mileage/new", {
      origin: "Studio",
      destination: "Venue",
      miles: "42",
    });
  });

  test("Finance · accounting period create", async ({ page }) => {
    await createInModule(page, "/studio/finance/periods/new", { period_label: `E2E ${stamp()}` });
  });

  test("Finance · time entry create", async ({ page }) => {
    await createInModule(page, "/studio/finance/time/new", { description: `E2E Time ${stamp()}` });
  });

  test("Forms · create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/forms/new", { slug: `e2e-form-${s}`, title: `E2E Form ${s}` });
  });

  test("Locations · create", async ({ page }) => {
    await createInModule(page, "/studio/locations/new", { name: `E2E Location ${stamp()}` });
  });

  test("Logistics · rate card create", async ({ page }) => {
    await createInModule(page, "/studio/logistics/ratecard/new", {
      name: `E2E Rate ${stamp()}`,
      sku: `E2E-SKU-${stamp()}`,
    });
  });

  test("ITIL · change create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/ops/toc/changes/new", {
      code: `CHG-${s.slice(-5)}`,
      title: `E2E Change ${s}`,
    });
  });

  test("ITIL · problem create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/ops/toc/problems/new", {
      code: `PRB-${s.slice(-5)}`,
      title: `E2E Problem ${s}`,
    });
  });

  test("Participants · delegation create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/participants/delegations/new", {
      code: `DEL-${s.slice(-5)}`,
      name: `E2E Delegation ${s}`,
    });
  });

  test("Participants · visa record create", async ({ page }) => {
    await createInModule(page, "/studio/participants/visa/new", { person_name: `E2E Person ${stamp()}` });
  });

  test("People · crew member create", async ({ page }) => {
    await createInModule(page, "/studio/people/crew/new", { name: `E2E Crew ${stamp()}` });
  });

  test("Procurement · RFQ create", async ({ page }) => {
    await createInModule(page, "/studio/procurement/rfqs/new", { title: `E2E RFQ ${stamp()}` });
  });

  test("Programs · review create", async ({ page }) => {
    await createInModule(page, "/studio/programs/reviews/new", { title: `E2E Review ${stamp()}` });
  });
});
