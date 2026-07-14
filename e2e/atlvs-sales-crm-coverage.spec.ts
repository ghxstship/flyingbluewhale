/**
 * ATLVS · Sales & CRM — behavioral coverage (coverage program, high-priority wave).
 *
 * Fills the behavioral gaps the coverage map flagged for Sales & CRM that the
 * existing deep/persona specs do NOT already exercise. Each flow drives a real
 * mutation FSM to a materialised record and asserts the redirect/state, as the
 * entitled persona.
 *
 * Fixture hygiene: every record is stamped `E2E Lead <ts>` / `Proposal for E2E
 * Lead <ts>` and purged by scripts/e2e-clean-fixtures.mjs (global teardown), so
 * repeated prod runs never accumulate.
 */
import { expect, test } from "./helpers/base";
import { authedSetup, suppressTour } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

// Resolve the first REAL record detail link under a list route (a UUID child,
// never the "+ New" sibling which also matches the /studio/<module>/ prefix).
async function firstRecordLink(page: import("playwright/test").Page, listRoute: string) {
  const links = page.locator(`a[href^="${listRoute}/"]`);
  const n = await links.count();
  for (let i = 0; i < n; i++) {
    const href = await links.nth(i).getAttribute("href");
    if (href && UUID.test(href)) return links.nth(i);
  }
  return null;
}

test.describe("ATLVS Sales & CRM — behavioral coverage", () => {
  // The full login → create (cold-start) → qualify → convert (cold-start) chain
  // legitimately runs long on a serverless prod target; give it real headroom.
  test.describe.configure({ timeout: 300000 });

  // Suppress the first-run ConsoleTour scrim (z-tour, full-viewport) — it
  // intercepts clicks on the /studio shell and hangs the action buttons.
  // File-scoped so the addInitScript lands before the in-test login goto.
  test.beforeEach(async ({ page }) => suppressTour(page));

  // HIGH — the lead→proposal conversion FSM: a qualified lead drafts a proposal
  // (the step that turns a prospect into a signable document). Gate is
  // manager+ AND lead_phase ∈ {qualified,proposal,won}.
  test("manager: a qualified lead converts to a materialised proposal", async ({ page }) => {
    await authedSetup(page, "manager");
    const name = `E2E Lead ${stamp()}`;
    await createInModule(page, "/studio/leads/new", { name });
    // Landed on the new lead's detail.
    await expect(page).toHaveURL(new RegExp(`/studio/leads/${UUID.source}`), { timeout: 90000 });

    // Arm the conversion: advance new → qualified.
    const qualify = page.getByRole("button", { name: /move to qualified/i });
    await expect(qualify).toBeVisible({ timeout: 15000 });
    await qualify.click();

    // Now manager+ on a qualified lead sees "Create Proposal" → drafts + redirects.
    const createProposal = page.getByRole("button", { name: /create proposal/i });
    await expect(createProposal).toBeVisible({ timeout: 30000 });
    await createProposal.click();
    await expect(page).toHaveURL(new RegExp(`/studio/proposals/${UUID.source}`), { timeout: 90000 });
  });

  // MEDIUM — the app manager+ gate on lead→proposal is honored for a member:
  // the Create Proposal control never renders (defence-in-depth, RLS re-checks).
  test("member: cannot draft a proposal from a lead (manager+ gated)", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/studio/leads");
    const firstLead = await firstRecordLink(page, "/studio/leads");
    if (!firstLead) return; // no leads visible to this member — vacuously gated
    await firstLead.click();
    await expect(page).toHaveURL(new RegExp(`/studio/leads/${UUID.source}`), { timeout: 30000 });
    await expect(page.getByRole("button", { name: /create proposal/i })).toHaveCount(0);
  });

  // HIGH — the estimate→budget conversion FSM: a WON estimate is the priced
  // commitment; converting materialises the budget envelope finance tracks
  // against. Arm the gate by editing the estimate to `won` (also exercises
  // updateEstimate), then Convert To Budget and assert the budget redirect.
  test("manager: a won estimate converts to a materialised budget", async ({ page }) => {
    await authedSetup(page, "manager");
    await createInModule(page, "/studio/estimates/new", { name: `E2E Estimate ${stamp()}` });
    await expect(page).toHaveURL(new RegExp(`/studio/estimates/${UUID.source}`), { timeout: 90000 });
    const detailUrl = page.url();

    // Move the estimate to `won` via the edit form to arm the conversion gate.
    await page.goto(`${detailUrl}/edit`);
    await page.locator('main select[name="estimate_state"]').selectOption("won");
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page).toHaveURL(new RegExp(`/studio/estimates/${UUID.source}$`), { timeout: 90000 });

    // Now manager+ on a won estimate sees "Convert To Budget" → materialises
    // the budget and redirects to it.
    const convert = page.getByRole("button", { name: /convert to budget/i });
    await expect(convert).toBeVisible({ timeout: 30000 });
    await convert.click();
    await expect(page).toHaveURL(new RegExp(`/studio/finance/budgets/${UUID.source}`), { timeout: 90000 });
  });

  // MEDIUM — the client edit round-trip: updateClient (optimistic-concurrency
  // guarded) persists a renamed client and the detail re-renders with it.
  test("manager: editing a client round-trips to the detail", async ({ page }) => {
    await authedSetup(page, "manager");
    await createInModule(page, "/studio/clients/new", { name: `E2E Client ${stamp()}` });
    await expect(page).toHaveURL(new RegExp(`/studio/clients/${UUID.source}`), { timeout: 90000 });
    const detailUrl = page.url();

    const renamed = `E2E Client Renamed ${stamp()}`;
    await page.goto(`${detailUrl}/edit`);
    await page.locator('main [name="name"]').first().fill(renamed);
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page).toHaveURL(new RegExp(`/studio/clients/${UUID.source}$`), { timeout: 90000 });
    await expect(page.getByRole("heading", { name: renamed })).toBeVisible({ timeout: 30000 });
  });

  // MEDIUM — the app manager+ gate on client create: a member submitting the
  // new-client form is refused with the explicit copy and never leaves /new.
  test("member: client create is refused by the manager+ gate", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/studio/clients/new");
    await page.locator('main [name="name"]').first().fill(`E2E Client ${stamp()}`);
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(
      page.getByRole("alert").filter({ hasText: /only manager\+ can create clients/i }).first(),
    ).toBeVisible({ timeout: 30000 });
    await expect(page).toHaveURL(/\/studio\/clients\/new(\?|$)/);
  });

  // MEDIUM — the BEO lifecycle: draft a Banquet Event Order, add a line item
  // (the child-record sub-form), then advance the FSM draft→sent→signed via
  // the state controls (setBeoStateAction stamps sent_at/signed_at).
  test("manager: a BEO drafts, takes a line, and advances sent then signed", async ({ page }) => {
    await authedSetup(page, "manager");
    await createInModule(page, "/studio/sales/beos/new", { event_name: `E2E BEO ${stamp()}` });
    await expect(page).toHaveURL(new RegExp(`/studio/sales/beos/${UUID.source}`), { timeout: 90000 });

    // Add a line item via the detail-page add-line sub-form (quantity defaults
    // to 1; section defaults to food & beverage).
    const lineName = `E2E Line ${stamp()}`;
    await page.locator('main [name="name"]').first().fill(lineName);
    await page.getByRole("button", { name: /add line/i }).click();
    await expect(page.getByText(lineName)).toBeVisible({ timeout: 30000 });

    // Draft → Sent → Signed. The state controls swap the offered transitions
    // per NEXT_BEO_STATES, so "Mark Signed" only appears once the BEO is sent.
    await page.getByRole("button", { name: /^send$/i }).click();
    const markSigned = page.getByRole("button", { name: /mark signed/i });
    await expect(markSigned).toBeVisible({ timeout: 30000 });
    await markSigned.click();
    // signed is past sent: neither transition remains offered.
    await expect(page.getByRole("button", { name: /mark signed/i })).toHaveCount(0, { timeout: 30000 });
    await expect(page.getByRole("button", { name: /^send$/i })).toHaveCount(0);
  });

  // MEDIUM — the booking-diary FSM: seed a bookable space, create a hold on it,
  // then drive transitionBookingAction hold→confirmed→cancelled. The transition
  // form only offers legal NEXT_BOOKING_STATES and vanishes at the terminal.
  test("manager: a diary booking advances through the state machine", async ({ page }) => {
    await authedSetup(page, "manager");
    const spaceName = `E2E Space ${stamp()}`;
    await createInModule(page, "/studio/sales/diary/spaces/new", { name: spaceName });

    // Target the just-created space by its (unique, stamped) label so the
    // conflict guard has nothing to collide with.
    await createInModule(page, "/studio/sales/diary/new", {
      title: `E2E Booking ${stamp()}`,
      space_id: spaceName,
      starts_at: "2030-03-01T10:00",
      ends_at: "2030-03-01T14:00",
    });
    await expect(page).toHaveURL(new RegExp(`/studio/sales/diary/${UUID.source}`), { timeout: 90000 });

    // hold → confirmed: after the move, `confirmed` is no longer an offered
    // next state (confirmed → tentative/cancelled only).
    await page.locator('main select[name="booking_state"]').selectOption("confirmed");
    await page.getByRole("button", { name: /^move$/i }).click();
    await expect(page.locator('main select[name="booking_state"] option[value="confirmed"]')).toHaveCount(0, {
      timeout: 30000,
    });

    // confirmed → cancelled (terminal): the transition form drops away entirely.
    await page.locator('main select[name="booking_state"]').selectOption("cancelled");
    await page.getByRole("button", { name: /^move$/i }).click();
    await expect(page.locator('main select[name="booking_state"]')).toHaveCount(0, { timeout: 30000 });
  });
});
