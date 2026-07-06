/**
 * Console product tour + chrome tooltips.
 *
 * The DS `Tour` primitive is wired as `<ConsoleTour>` in the platform shell: it
 * auto-launches once per browser and replays from the Help menu ("Take the
 * tour"). The walk spotlights the `data-tour="…"` anchors on the workspace
 * chrome, which also carry `Hint` tooltips. This guards that the anchors ship,
 * the tour launches + completes, and the Help entry point works.
 */
import { expect, test } from "playwright/test";
import { authedSetup } from "./helpers/auth";

test.describe("Console tour + chrome tooltips (owner)", () => {
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("workspace chrome carries the tour anchors", async ({ page }) => {
    await page.goto("/studio");
    await expect(page.locator('[data-platform="atlvs"]').first()).toBeVisible({ timeout: 15_000 });
    // These anchors are the tour targets + tooltip hosts. `nav` is the sidebar
    // (desktop), `create`/`notifications`/`help` the top-bar icon buttons.
    for (const anchor of ["nav", "create", "notifications", "help"]) {
      await expect(page.locator(`[data-tour="${anchor}"]`).first(), `[data-tour="${anchor}"]`).toBeAttached();
    }
  });

  test("Help → Take the tour launches the spotlight walk and completes", async ({ page }) => {
    await page.goto("/studio");
    await expect(page.locator('[data-tour="help"]').first()).toBeVisible({ timeout: 15_000 });

    // If the first-run tour auto-opened, peel it so we drive it deliberately.
    await page.keyboard.press("Escape");

    await page.locator('[data-tour="help"]').first().click();
    await page.getByRole("button", { name: /take the tour/i }).click();

    // The tour bubble is a role=dialog with Next/Done + Skip controls.
    const tour = page.getByRole("dialog").filter({ has: page.getByRole("button", { name: /^(next|done)$/i }) });
    await expect(tour.first()).toBeVisible({ timeout: 10_000 });

    // Walk to the end — Next until it becomes Done, then finish.
    for (let i = 0; i < 8; i++) {
      const done = tour.getByRole("button", { name: /^done$/i });
      if (await done.count()) {
        await done.first().click();
        break;
      }
      await tour.getByRole("button", { name: /^next$/i }).first().click();
    }
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 10_000 });
  });
});
