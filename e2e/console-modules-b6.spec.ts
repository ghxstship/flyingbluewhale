/**
 * Console module create flows — batch 6: SELF-SEEDING dependent creates.
 *
 * These `/new` forms hard-require a pre-existing related record chosen from a
 * dropdown. Instead of relying on external fixtures, each test first creates the
 * prerequisite record(s) as the `owner` fixture, so the dependent form's
 * required select has an option to pick (the shared helper auto-selects the
 * first non-empty option when given the select's field name). Fully
 * self-contained.
 */
import { test } from "./helpers/base";
import { authedSetup } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

test.describe("console modules — self-seeding dependent creates (batch 6)", () => {
  // Each test does 2–3 sequential creates; on a cold dev server that exceeds the
  // default 45s test budget. Give the chains room.
  test.describe.configure({ timeout: 150000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("Production · rental (seed asset → rental)", async ({ page }) => {
    // Equipment folded into the unified assets store (kit-20 Phase A) — seed
    // via the canonical /studio/assets/new form; the rental form's select is
    // now named asset_id ("auto" = helper picks the first non-empty option).
    await createInModule(page, "/studio/assets/new", {
      display_name: `E2E Asset ${stamp()}`,
      asset_kind: "e2e-gear",
    });
    await createInModule(page, "/studio/production/rentals/new", {
      asset_id: "auto",
      rate: "100",
      starts_at: "2030-01-01T08:00",
      ends_at: "2030-01-02T08:00",
    });
  });

  test("Procurement · submittal (seed vendor → submittal)", async ({ page }) => {
    await createInModule(page, "/studio/procurement/vendors/new", { name: `E2E Vendor ${stamp()}` });
    await createInModule(page, "/studio/submittals/new", {
      title: `E2E Submittal ${stamp()}`,
      vendor_id: "auto",
    });
  });

  test.skip("People · MSA (seed crew → MSA)", async ({ page }) => {
    await createInModule(page, "/studio/people/crew/new", { name: `E2E Crew ${stamp()}` });
    await createInModule(page, "/studio/people/msas/new", { crew_member_id: "auto" });
  });

  test.skip("Participants · entry (seed delegation → entry)", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/participants/delegations/new", {
      code: `DEL-${s.slice(-5)}`,
      name: `E2E Delegation ${s}`,
    });
    await createInModule(page, "/studio/participants/entries/new", {
      delegation_id: "auto",
      participant_name: `E2E Participant ${s}`,
    });
  });

  test.skip("Procurement · prequalification (seed vendor + questionnaire → prequal)", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/procurement/vendors/new", { name: `E2E Vendor ${s}` });
    await createInModule(page, "/studio/procurement/prequalification/questionnaires/new", {
      code: `PQ-${s.slice(-5)}`,
      name: `E2E Q ${s}`,
    });
    await createInModule(page, "/studio/procurement/prequalification/new", {
      vendor_id: "auto",
      questionnaire_id: "auto",
    });
  });

  test.skip("Operations · inspection (seed template → inspection)", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/inspections/templates/new", {
      code: `INS-${s.slice(-5)}`,
      name: `E2E Template ${s}`,
    });
    await createInModule(page, "/studio/inspections/new", {
      name: `E2E Inspection ${s}`,
      template_id: "auto",
    });
  });

  test.skip("Finance · pay-app (seed vendor → PO → pay-app)", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/procurement/vendors/new", { name: `E2E Vendor ${s}` });
    await createInModule(page, "/studio/procurement/purchase-orders/new", {
      title: `E2E PO ${s}`,
      vendor_id: "auto",
      amount: "5000",
    });
    await createInModule(page, "/studio/finance/pay-apps/new", { purchase_order_id: "auto" });
  });

  test.skip("Procurement · PO change order (seed vendor → PO → change order)", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/procurement/vendors/new", { name: `E2E Vendor ${s}` });
    await createInModule(page, "/studio/procurement/purchase-orders/new", {
      title: `E2E PO ${s}`,
      vendor_id: "auto",
      amount: "5000",
    });
    await createInModule(page, "/studio/procurement/po-change-orders/new", {
      purchase_order_id: "auto",
      title: `E2E CO ${s}`,
      reason: "E2E reason",
      amount: "500",
    });
  });
});
