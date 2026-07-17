/**
 * COMPVSS · mobile /m — behavioral coverage (coverage program).
 *
 * Fills the behavioral gaps the coverage map flagged for the COMPVSS field PWA
 * that the render/deep specs do NOT already exercise. Each flow drives a real
 * server-action mutation and asserts an observable effect (redirect, read-back,
 * FSM state flip, or an absent gated control), as the entitled persona.
 *
 * The /m surfaces are built on the kit `FormScreen` (data-driven full-screen
 * forms — NOT a plain `<form>`), so `createInModule` can't drive them. Instead
 * we fill the kit controls directly (`.formscreen input/textarea/select`) which
 * ARMS the CTA (the kit submit no-ops while required fields are empty), then
 * click the CTA by its label.
 *
 * Fixture hygiene: every created record is stamped `E2E <Thing> <ts>` and purged
 * by scripts/e2e-clean-fixtures.mjs (global teardown), so repeated prod runs
 * never accumulate.
 */
import { expect, test } from "./helpers/base";
import { authedSetup, suppressTour } from "./helpers/auth";
import { stamp } from "./helpers/forms";

test.describe("COMPVSS · mobile /m — behavioral coverage", () => {
  // The kit forms + serverless cold-starts run long on a prod target; give real
  // headroom.
  test.describe.configure({ timeout: 300000 });

  // suppressTour is harmless on /m (no ConsoleTour there) but keeps parity with
  // the platform specs and guards against any shared first-run scrim. File-scoped
  // so the addInitScript lands before the first login goto.
  test.beforeEach(async ({ page }) => suppressTour(page));

  // HIGH — the shift-handover write path (submitHandover → `handovers`). A crew
  // member files an end-of-shift handover and it reads back on the trail. Fully
  // self-contained (project_id is optional; RLS gates from_user_id = auth.uid()).
  test("crew: submit a shift handover and it reads back on the trail", async ({ page }) => {
    await authedSetup(page, "member");
    const summary = `E2E Handover ${stamp()}`;

    await page.goto("/m/handover/new");
    await expect(page.locator(".formscreen")).toBeVisible({ timeout: 30000 });

    // relief (select, required) — pick any real option to arm the CTA.
    await page.locator(".formscreen select").first().selectOption({ index: 1 });
    // status seg defaults to "All Clear" (required, satisfied by default).
    // summary (first textarea, required).
    await page.locator(".formscreen textarea").first().fill(summary);

    await page.getByRole("button", { name: /submit handover/i }).click();

    // Routes back to the handover trail where the new row renders its summary.
    await expect(page).toHaveURL(/\/m\/handover(\?|$)/, { timeout: 90000 });
    await expect(page.getByText(summary)).toBeVisible({ timeout: 30000 });
  });

  // MEDIUM — the field-marketplace create → mark-sold lifecycle (createListing →
  // markSold). A crew member lists an item (active), then marks it sold, and the
  // active-only grid drops it. Self-contained; RLS WITH CHECK gates seller_user_id.
  test("crew: create a marketplace listing then mark it sold", async ({ page }) => {
    await authedSetup(page, "member");
    const title = `E2E Listing ${stamp()}`;

    await page.goto("/m/market");
    await page.getByRole("button", { name: /list an item/i }).click();
    await expect(page.locator(".formscreen")).toBeVisible({ timeout: 30000 });

    // listing form: item (first text input, required) arms the CTA.
    await page.locator('.formscreen input[type="text"]').first().fill(title);
    await page.getByRole("button", { name: /post listing/i }).click();

    // Back on the grid — my new active listing renders its title + a Mark Sold
    // control (isMine).
    const card = page.locator(".mcard").filter({ hasText: title });
    await expect(card).toBeVisible({ timeout: 30000 });

    await card.getByRole("button", { name: /mark sold/i }).click();

    // sold → drops from the active-only grid.
    await expect(page.getByText(title)).toHaveCount(0, { timeout: 30000 });
  });

  // MEDIUM — /m/requests is now the REAL approvals engine (approval.clear):
  // a decision deck over `approval_instances`, no longer the retired two-table
  // time-off/swap queue. Fixture-free render assertion: the manager band gets
  // the deck (either the top card with its Approve/Decline thumb targets, or
  // the honest "All Clear" empty state) — never the old time-off rows.
  //
  // The full decide flow (seed policy + instance → approve → state flip via
  // record_approval_decision) needs a service-client approvals fixture that
  // doesn't exist yet; that spec is the manifest cell's REMAINING item.
  test("manager: /m/requests renders the approvals deck (approval_instances)", async ({ page }) => {
    await authedSetup(page, "manager");
    await page.goto("/m/requests");
    await expect(page.locator(".scr-h").first()).toBeVisible({ timeout: 30000 });

    // Deck with a card → both decision buttons render; empty org queue → the
    // empty state renders. Either is the engine; neither is the old queue.
    const approve = page.getByRole("button", { name: /^approve$/i });
    const emptyState = page.getByText(/all clear/i).first();
    await expect(approve.or(emptyState).first()).toBeVisible({ timeout: 30000 });
    if ((await approve.count()) > 0) {
      await expect(page.getByRole("button", { name: /^decline$/i }).first()).toBeVisible();
    }
  });

  // LOW (gated-denial) — members get the read-only "your submissions" view of
  // their own initiated instances: NO approve/decline affordances anywhere.
  // Defence-in-depth over the server gates (isManagerPlus in the action AND the
  // manager-band re-check inside the record_approval_decision RPC).
  test("crew: requests queue exposes no approve/decline controls", async ({ page }) => {
    await authedSetup(page, "crew");
    await page.goto("/m/requests");
    // The screen renders (its heading paints) but carries no decision buttons —
    // don't couple to the exact heading copy (i18n-resolved), just to "loaded".
    await expect(page.locator("h1, .scr-h").first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("button", { name: /^approve$/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^decline$/i })).toHaveCount(0);
  });
});
