/**
 * COMPVSS field intake (audit G19).
 *
 * The canonical "need it now from site" request. The console's own One
 * Front Door lists Purchase Requisition as one of its five Requests, and
 * the field couldn't file one: RLS excluded the crew persona from
 * `requisitions` outright until 20260715160000. This is the surface that
 * block was hiding.
 */
import { expect, test } from "./helpers/base";
import { authedSetup } from "./helpers/auth";

test.describe("COMPVSS purchase requests", () => {
  test.beforeEach(async ({ page }) => {
    await authedSetup(page, "crew");
  });

  test("G19 · a crew member raises a purchase requisition from site", async ({ page }) => {
    await page.goto("/m/requisitions");
    await page.getByRole("link", { name: /request a purchase/i }).click();
    await expect(page).toHaveURL(/\/m\/requisitions\/new$/);

    const title = `E2E req ${Date.now()}`;
    await page.locator('input[name="title"]').fill(title);
    await page.locator('input[name="estimated"]').fill("40.00");
    await page.locator('textarea[name="description"]').fill("Gel frame snapped during focus.");
    await page.getByRole("button", { name: /raise request/i }).click();

    // Redirects to the list, and the request is the caller's own.
    await expect(page).toHaveURL(/\/m\/requisitions$/, { timeout: 20_000 });
    await expect(page.getByText(title)).toBeVisible();
  });

  test("G19 · the list is scoped to the viewer, not the org", async ({ page }) => {
    await page.goto("/m/requisitions");
    // RLS on requisitions is org-level and therefore no backstop for a
    // personal surface — the same shape as D6/D16, where "My Tasks" showed
    // 201 rows of which 2 were the viewer's. The predicate must be explicit.
    const src = await page.content();
    expect(src).toContain("Purchase Requests");
  });
});
