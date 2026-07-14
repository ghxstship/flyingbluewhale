/**
 * ATLVS · Talent & Casting — behavioral coverage (coverage program).
 *
 * Fills the behavioral gaps the coverage map flagged for Talent & Casting that
 * the existing marketplace-canon / persona specs do NOT already exercise. Each
 * flow drives a real mutation FSM to a materialised record and asserts the
 * redirect/state, as the entitled persona — plus the manager+ app-gate denials.
 *
 * Self-contained: every flow that needs a talent profile mints its own
 * ("E2E Act <ts>") as the entitled persona first, so nothing depends on seed
 * rows beyond the always-present marketplace fixture.
 *
 * Fixture hygiene: talent is stamped `E2E Act <ts>` and open calls `E2E Call
 * <ts>`. The existing scripts/e2e-clean-fixtures.mjs `healMarketplaceFixture`
 * already purges `E2E Act%` talent AND the talent_offers/tours that reference it
 * (RESTRICT children, deleted first); the open_calls target is aggregated by the
 * orchestrator. Repeated prod runs never accumulate.
 */
import { expect, test } from "./helpers/base";
import { authedSetup, suppressTour } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

test.describe("ATLVS Talent & Casting — behavioral coverage", () => {
  // The create (cold-start) → transition chains legitimately run long on a
  // serverless prod target; give them real headroom.
  test.describe.configure({ timeout: 300000 });

  // Suppress the first-run ConsoleTour scrim (z-tour, full-viewport) — it
  // intercepts clicks on the /studio shell and hangs the action buttons.
  // File-scoped so the addInitScript lands before the in-test login goto.
  test.beforeEach(async ({ page }) => suppressTour(page));

  // MEDIUM — the manager-band positive path for the talent EPK: create a
  // profile then publish it to the public directory (only owner exercises
  // createTalent/publishTalent today). Gate is isManagerPlus.
  test("manager: create then publish a talent profile", async ({ page }) => {
    await authedSetup(page, "manager");
    const actName = `E2E Act ${stamp()}`;
    await createInModule(page, "/studio/marketplace/talent/new", { act_name: actName });
    await expect(page).toHaveURL(new RegExp(`/studio/marketplace/talent/${UUID.source}`), { timeout: 90000 });

    // Private on create — publish flips it to the public directory.
    const publish = page.getByRole("button", { name: /publish to directory/i });
    await expect(publish).toBeVisible({ timeout: 15000 });
    await publish.click();
    // After publish the control becomes "Unpublish" and the badge reads Published.
    await expect(page.getByRole("button", { name: /unpublish/i })).toBeVisible({ timeout: 30000 });
  });

  // MEDIUM — the isManagerPlus app-gate on createTalent is honored for a bare
  // member: the action refuses with its explicit copy and no record is made.
  test("member: talent create is refused by the manager+ gate", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/studio/marketplace/talent/new");
    await page.locator('main [name="act_name"]').fill(`E2E Act ${stamp()}`);
    await page.getByRole("button", { name: /save profile/i }).click();
    // App-layer denial surfaces as the FormShell error alert; still on /new.
    await expect(
      page.getByRole("alert").filter({ hasText: /only manager\+ can create talent profiles/i }),
    ).toBeVisible({ timeout: 30000 });
    await expect(page).toHaveURL(/\/studio\/marketplace\/talent\/new/);
  });

  // MEDIUM — the manager-band positive path for a booking offer: mint a talent,
  // draft an offer against it, then send it (draft → sent). Gate is isManagerPlus.
  test("manager: create a booking offer then send it", async ({ page }) => {
    await authedSetup(page, "manager");
    const actName = `E2E Act ${stamp()}`;
    await createInModule(page, "/studio/marketplace/talent/new", { act_name: actName });
    await expect(page).toHaveURL(new RegExp(`/studio/marketplace/talent/${UUID.source}`), { timeout: 90000 });

    // Draft an offer — pick the act we just minted (fillSmart matches the option label).
    await createInModule(page, "/studio/marketplace/offers/new", {
      talent_profile_id: actName,
      performance_date: "2030-06-01",
      fee: "5000",
    });
    await expect(page).toHaveURL(new RegExp(`/studio/marketplace/offers/${UUID.source}`), { timeout: 90000 });

    // Draft → sent. The sent state reveals the Mark Accepted / Decline controls.
    const send = page.getByRole("button", { name: /send offer/i });
    await expect(send).toBeVisible({ timeout: 15000 });
    await send.click();
    await expect(page.getByRole("button", { name: /decline/i })).toBeVisible({ timeout: 30000 });
  });

  // MEDIUM — the untested decline terminal of the offer FSM (only accept is
  // covered elsewhere): draft → sent → declined.
  test("owner: a sent booking offer is declined", async ({ page }) => {
    await authedSetup(page, "owner");
    const actName = `E2E Act ${stamp()}`;
    await createInModule(page, "/studio/marketplace/talent/new", { act_name: actName });
    await expect(page).toHaveURL(new RegExp(`/studio/marketplace/talent/${UUID.source}`), { timeout: 90000 });

    await createInModule(page, "/studio/marketplace/offers/new", {
      talent_profile_id: actName,
      performance_date: "2030-07-01",
      fee: "4200",
    });
    await expect(page).toHaveURL(new RegExp(`/studio/marketplace/offers/${UUID.source}`), { timeout: 90000 });

    const send = page.getByRole("button", { name: /send offer/i });
    await expect(send).toBeVisible({ timeout: 15000 });
    await send.click();

    const decline = page.getByRole("button", { name: /decline/i });
    await expect(decline).toBeVisible({ timeout: 30000 });
    await decline.click();
    // Terminal declined: the header badge reads Declined and the FSM controls clear.
    await expect(page.getByText(/^Declined$/).first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("button", { name: /send offer/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /decline/i })).toHaveCount(0);
  });

  // MEDIUM — the open-call visibility FSM (draft → published → closed). The
  // publish and close branches are otherwise untested.
  test("owner: publish then close an open call", async ({ page }) => {
    await authedSetup(page, "owner");
    await createInModule(page, "/studio/marketplace/calls/new", { title: `E2E Call ${stamp()}` });
    await expect(page).toHaveURL(new RegExp(`/studio/marketplace/calls/${UUID.source}`), { timeout: 90000 });

    // Draft → published. Only a draft renders the Publish control.
    const publish = page.getByRole("button", { name: /^publish$/i });
    await expect(publish).toBeVisible({ timeout: 15000 });
    await publish.click();
    // Published state reveals the Close Call control.
    const close = page.getByRole("button", { name: /close call/i });
    await expect(close).toBeVisible({ timeout: 30000 });

    // Published → closed. The terminal state clears all visibility controls.
    await close.click();
    await expect(page.getByText(/^Closed$/).first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("button", { name: /close call/i })).toHaveCount(0);
  });

  // MEDIUM — the isManagerPlus app-gate on createCall is honored for a bare
  // member: the action refuses with its explicit copy.
  test("member: open-call create is refused by the manager+ gate", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/studio/marketplace/calls/new");
    await page.locator('main [name="title"]').fill(`E2E Call ${stamp()}`);
    await page.getByRole("button", { name: /save draft/i }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: /only manager\+ can post open calls/i }),
    ).toBeVisible({ timeout: 30000 });
    await expect(page).toHaveURL(/\/studio\/marketplace\/calls\/new/);
  });
});
