/**
 * ATLVS · Operations & Logistics — behavioral coverage (coverage program).
 *
 * Fills the behavioral gaps the coverage map flagged for Operations & Logistics
 * that the existing deep/persona specs do NOT already exercise. Each flow drives
 * a real mutation FSM (reservation lifecycle, reservation → event record chain,
 * the unified-schedule write path) as the entitled persona, plus the manager+
 * create gate as a lower role.
 *
 * Fixture hygiene: every created record is stamped (`E2E Reservation <ts>`,
 * `E2E-T-<ts>`, `E2E Activity <ts>`) and purged by scripts/e2e-clean-fixtures.mjs
 * (global teardown), so repeated prod runs never accumulate.
 */
import { expect, test } from "./helpers/base";
import { authedSetup, suppressTour } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

test.describe("ATLVS Operations & Logistics — behavioral coverage", () => {
  // Login → create (cold-start) → transition chains legitimately run long on a
  // serverless prod target; give them real headroom.
  test.describe.configure({ timeout: 300000 });

  // Suppress the first-run ConsoleTour scrim (z-tour, full-viewport) — it
  // intercepts clicks on the /studio shell and hangs the action buttons.
  // File-scoped so the addInitScript lands before the in-test login goto.
  test.beforeEach(async ({ page }) => suppressTour(page));

  // HIGH — reservation create: a manager books a table for a guest and lands on
  // the detail in the `booked` state (the entry state of the reservation FSM).
  test("manager: create a reservation → detail opens in booked state", async ({ page }) => {
    await authedSetup(page, "manager");
    const guest = `E2E Reservation ${stamp()}`;
    await createInModule(page, "/studio/operations/reservations/new", { guest_name: guest });
    await expect(page).toHaveURL(new RegExp(`/studio/operations/reservations/${UUID.source}`), { timeout: 90000 });
    await expect(page.getByText(/^Booked$/).first()).toBeVisible({ timeout: 30000 });
  });

  // MEDIUM — reservation FSM transition: booked → seated via the TransitionControl
  // (canTransitionReservation is re-checked server-side). The state badge flips.
  test("manager: advance a reservation booked → seated", async ({ page }) => {
    await authedSetup(page, "manager");
    const guest = `E2E Reservation ${stamp()}`;
    await createInModule(page, "/studio/operations/reservations/new", { guest_name: guest });
    await expect(page).toHaveURL(new RegExp(`/studio/operations/reservations/${UUID.source}`), { timeout: 90000 });

    // The select defaults to the first reachable next state (seated) for a booked
    // reservation; just submit the transition.
    await page.getByRole("button", { name: /update state/i }).click();
    await expect(page.getByText(/^Seated$/).first()).toBeVisible({ timeout: 30000 });
  });

  // HIGH — the v7.8 record chain: a booked reservation confirms into a live
  // event, spawning a projects row pre-filled from the reservation and
  // redirecting to it (idempotent on re-run via the [project:<id>] notes marker).
  test("manager: Confirm → Create Event spawns a project", async ({ page }) => {
    await authedSetup(page, "manager");
    const guest = `E2E Reservation ${stamp()}`;
    await createInModule(page, "/studio/operations/reservations/new", { guest_name: guest });
    await expect(page).toHaveURL(new RegExp(`/studio/operations/reservations/${UUID.source}`), { timeout: 90000 });

    await page.getByRole("button", { name: /create event/i }).click();
    await expect(page).toHaveURL(new RegExp(`/studio/projects/${UUID.source}`), { timeout: 90000 });
  });

  // MEDIUM — the manager+ create gate on reservations is honored for a member:
  // the create action refuses ("Only manager+ can create reservations") and the
  // form stays on /new (defence-in-depth over the RLS write policy).
  test("member: reservation create is refused by the manager+ gate", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/studio/operations/reservations/new");
    await page.locator('main [name="guest_name"]').fill(`E2E Reservation ${stamp()}`);
    await page.locator('main [name="reserved_for"]').fill("2030-01-01T10:00");
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page).toHaveURL(/\/studio\/operations\/reservations\/new(\?|$)/, { timeout: 30000 });
    // FormShell renders the error in an Alert (role="alert") AND mirrors it into
    // the assertive sr-only live region (also role="alert") — two nodes with the
    // same text, so filter by role + .first() to avoid a strict-mode violation.
    await expect(
      page.getByRole("alert").filter({ hasText: /manager\+ can create reservations/i }).first(),
    ).toBeVisible({ timeout: 30000 });
  });

  // MEDIUM — venue table create seeds the seating inventory reservations bind to.
  // The create redirects back to the reservations hub (no dedicated detail page).
  test("manager: create a venue table for the floor plan", async ({ page }) => {
    await authedSetup(page, "manager");
    await createInModule(page, "/studio/operations/reservations/tables/new", {
      table_no: `E2E-T-${stamp()}`,
    });
    await expect(page).toHaveURL(/\/studio\/operations\/reservations(\?|$)/, { timeout: 90000 });
  });

  // HIGH — the Unified Schedule write path: the New Activity composer submits a
  // typed activity with no bound resource (so the credential/double-book/rest
  // guardrails pass clean), the dialog closes on success, and the block lands on
  // the timeline. Only field presence was asserted before; the whole
  // createActivity mutation was uncovered.
  test("manager: New Activity composer writes a block to the timeline", async ({ page }) => {
    await authedSetup(page, "manager");
    await page.goto("/studio/operations/schedule");
    const name = `E2E Activity ${stamp()}`;

    await page.getByRole("button", { name: /new activity/i }).click();
    await page.locator('[name="name"]').fill(name);
    await page.getByRole("button", { name: /^create$/i }).click();

    // A clean success (no guardrail error/warning) closes the dialog + revalidates.
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 45000 });
    // Read the committed row back off the timeline for today.
    await page.goto("/studio/operations/schedule");
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 30000 });
  });
});
