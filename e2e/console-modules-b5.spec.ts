/**
 * Console module create flows — batch 5. Final breadth pass over the remaining
 * self-contained console `/new` create routes: safety suite, legal, transport,
 * workforce, settings, services, sustainability, schedule, inspections
 * templates, prequalification questionnaires, programs readiness. Uses the
 * shared form helper; asserts each create redirects off /new with no error.
 *
 * Routes that hard-require a pre-existing related record selected from a
 * (possibly empty) dropdown — agency tours (talent), production rentals
 * (equipment), pay-apps/po-change-orders (PO), prequalification (vendor+
 * questionnaire), submittals (vendor), people MSAs (crew), subscriptions
 * (party), maintenance schedules (target), takeoffs (site plan), site-plans
 * (composite code) — are intentionally left to fixture-seeded specs.
 */
import { test } from "playwright/test";
import { authedSetup } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

test.describe("console modules — create flows (batch 5)", () => {
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("Inspections · template create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/inspections/templates/new", {
      code: `INS-${s.slice(-5)}`,
      name: `E2E Template ${s}`,
    });
  });

  test("Procurement · prequalification questionnaire create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/procurement/prequalification/questionnaires/new", {
      code: `PQ-${s.slice(-5)}`,
      name: `E2E Questionnaire ${s}`,
    });
  });

  test("Legal · insurance policy create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/legal/insurance/new", {
      carrier: `E2E Carrier ${s}`,
      policy_no: `POL-${s.slice(-6)}`,
    });
  });

  test("Legal · DSAR create", async ({ page }) => {
    await createInModule(page, "/studio/legal/privacy/dsar/new", { requester_email: `dsar-${stamp()}@test.example` });
  });

  test("People · credential create", async ({ page }) => {
    await createInModule(page, "/studio/people/credentials/new", { number: `CRED-${stamp().slice(-6)}` });
  });

  test("Programs · readiness exercise create", async ({ page }) => {
    await createInModule(page, "/studio/programs/readiness/new", { name: `E2E Readiness ${stamp()}` });
  });

  test("Safety · environmental reading create", async ({ page }) => {
    await createInModule(page, "/studio/safety/environmental/new", {});
  });

  test("Safety · guard tour create", async ({ page }) => {
    await createInModule(page, "/studio/safety/guard-tours/new", { name: `E2E Guard Tour ${stamp()}` });
  });

  test("Safety · major incident create", async ({ page }) => {
    await createInModule(page, "/studio/safety/major-incident/new", { name: `E2E Major Incident ${stamp()}` });
  });

  test("Safety · medical encounter create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/safety/medical/encounters/new", {
      patient_ref: `PT-${s.slice(-5)}`,
      chief_complaint: "E2E complaint",
    });
  });

  test("Safety · playbook create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/safety/playbooks/new", { slug: `e2e-pb-${s}`, title: `E2E Playbook ${s}` });
  });

  test("Safety · safeguarding case create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/safety/safeguarding/new", {
      narrative: `E2E narrative ${s}`,
      subject_ref: `SUBJ-${s.slice(-5)}`,
    });
  });

  test("Schedule · baseline create", async ({ page }) => {
    await createInModule(page, "/studio/schedule/baselines/new", { name: `E2E Baseline ${stamp()}` });
  });

  test("Services · request create", async ({ page }) => {
    await createInModule(page, "/studio/services/requests/new", {
      summary: `E2E Service ${stamp()}`,
      description: "E2E service request body.",
    });
  });

  test("Settings · ticketing integration create", async ({ page }) => {
    await createInModule(page, "/studio/settings/integrations/ticketing/new", { label: `E2E Ticketing ${stamp()}` });
  });

  // Skipped: center_lat/lng use a map-picker + .refine() validators that a plain
  // field fill doesn't satisfy; needs a map-interaction-aware spec.
  test.skip("Settings · time-clock zone create", async ({ page }) => {
    await createInModule(page, "/studio/settings/time-clock-zones/new", {
      name: `E2E Zone ${stamp()}`,
      center_lat: "25.79",
      center_lng: "-80.13",
      radius_m: "150",
    });
  });

  test("Sustainability · carbon entry create", async ({ page }) => {
    await createInModule(page, "/studio/sustainability/carbon/new", {});
  });

  test("Transmittals · create", async ({ page }) => {
    await createInModule(page, "/studio/transmittals/new", { subject: `E2E Transmittal ${stamp()}` });
  });

  test("Transport · arrivals/departures create", async ({ page }) => {
    await createInModule(page, "/studio/transport/ad/new", { flight_ref: `FL-${stamp().slice(-5)}` });
  });

  test("Transport · dispatch create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/transport/dispatch/new", {
      vehicle_ref: `VEH-${s.slice(-5)}`,
      scheduled_depart: "2030-01-01T08:00",
      scheduled_arrive: "2030-01-01T12:00",
    });
  });

  test("Venues · create", async ({ page }) => {
    await createInModule(page, "/studio/venues/new", { name: `E2E Venue ${stamp()}` });
  });

  test("Workforce · badge create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/workforce/badges/new", { code: `BDG-${s.slice(-5)}`, name: `E2E Badge ${s}` });
  });

  test("Workforce · contractor create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/workforce/contractors/new", {
      full_name: `E2E Contractor ${s}`,
      email: `e2e-con-${s}@test.example`,
    });
  });

  test("Workforce · onboarding flow create", async ({ page }) => {
    await createInModule(page, "/studio/workforce/onboarding/new", { name: `E2E Onboarding ${stamp()}` });
  });

  test("Workforce · roster create", async ({ page }) => {
    await createInModule(page, "/studio/workforce/rosters/new", { name: `E2E Roster ${stamp()}` });
  });
});
