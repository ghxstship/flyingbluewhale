import { expect, test } from "./helpers/base";
import { authedSetup } from "./helpers/auth";

/**
 * M3 — the console "zero-training layer" (v7.8). The audit found these marquee
 * surfaces were render-only or asserted as static links, never actually
 * exercised: the Event Spine (Sell→Settle checklist on Home), the One-Front-Door
 * CreateMenu (the "+" Request-first menu), and My Work. This drives each as the
 * owner:
 *   - the Event Spine renders its lifecycle steps on /studio;
 *   - the "+" menu OPENS and surfaces the five Request intakes;
 *   - My Work renders the personal spine (heading + sections).
 */
test.describe("console zero-training layer (M3)", () => {
  test.describe.configure({ timeout: 150_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("Event Spine renders the Sell→Settle lifecycle steps on Home", async ({ page }) => {
    await page.goto("/studio");
    // Spine-specific step labels (not generic nav words) prove the island rendered.
    await expect(page.getByText("Deal Won").first(), "spine step: Deal Won").toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Proposal Signed").first(), "spine step: Proposal Signed").toBeVisible();
    await expect(page.getByText("Requisitions Converted").first(), "spine step: Requisitions Converted").toBeVisible();
  });

  test("the One-Front-Door + menu opens with the five Request intakes", async ({ page }) => {
    await page.goto("/studio");
    await page.getByRole("button", { name: /create or request/i }).click();
    await expect(page.getByText(/request · one front door/i), "the Request-first header").toBeVisible({
      timeout: 10_000,
    });
    for (const intake of [
      /gear & advance/i,
      /purchase requisition/i,
      /time off/i,
      /report it/i,
      /it & facilities/i,
    ]) {
      await expect(page.getByText(intake).first(), `intake ${intake}`).toBeVisible();
    }
  });

  test("My Work renders the personal spine (heading + sections)", async ({ page }) => {
    await page.goto("/studio/my-work");
    await expect(page.getByRole("heading", { name: /my work/i }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/my tasks/i).first(), "My Tasks section").toBeVisible();
    await expect(page.getByText(/my purchase requisitions/i).first(), "My Requisitions section").toBeVisible();
  });
});
