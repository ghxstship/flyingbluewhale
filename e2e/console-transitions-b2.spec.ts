/**
 * Console state-machine transitions — batch 2. Extends console-transitions.spec
 * with detail-page lifecycle transitions for modules whose create flow already
 * passes (so the spec can create the record, land on its detail, drive a
 * transition, and assert the next state surfaces — exercising the actual
 * server-action transition path, not just the create).
 */
import { expect, test } from "playwright/test";
import { authedSetup } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

test.describe("console — state-machine transitions (batch 2)", () => {
  test.describe.configure({ timeout: 120000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("Punch item · open → start (lifecycle advances)", async ({ page }) => {
    await createInModule(page, "/console/punch/new", { title: `E2E Punch ${stamp()}` });
    // On the punch detail. Drive the first transition.
    const start = page.getByRole("button", { name: /^start$/i }).first();
    await expect(start).toBeVisible({ timeout: 15000 });
    await start.click();
    // No error surface, and a later-stage control (Mark ready / Close) appears.
    await expect(page.getByRole("alert").filter({ hasText: /error|failed|invalid/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /mark ready|^close$/i }).first()).toBeVisible({ timeout: 15000 });
  });

  // Skipped: fabrication create redirects to the LIST (not a stable detail URL),
  // so the production_phase transition control isn't on the landing page. Driving
  // it needs the created order's detail URL, which the generic create helper
  // doesn't surface — best done by a fixture-seeded fabrication detail spec.
  test.skip("Fabrication order · open → start (production_phase advances)", async ({ page }) => {
    await createInModule(page, "/console/production/fabrication/new", { name: `E2E Fab ${stamp()}` });
    // On the fabrication detail. The order may start queued (first action "Open")
    // or already open ("Start") — drive whichever forward transition is exposed.
    const firstStep = page.getByRole("button", { name: /^(open|start)$/i }).first();
    await expect(firstStep).toBeVisible({ timeout: 15000 });
    await firstStep.click();
    await expect(page.getByRole("alert").filter({ hasText: /error|failed|invalid/i })).toHaveCount(0);
    // The production_phase advanced — a later-stage control is now exposed.
    await expect(page.getByRole("button", { name: /^start$|mark complete|^complete$/i }).first()).toBeVisible({
      timeout: 15000,
    });
  });
});
