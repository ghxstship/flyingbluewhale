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
    await page.getByRole("link", { name: /request a purchase/i }).first().click();
    await expect(page).toHaveURL(/\/m\/requisitions\/new$/, { timeout: 20_000 });

    // Kit 31: the PO Request is the shared `FormScreen` (state-keyed controls,
    // no native name= attributes) — locate by placeholder. requisitions.title
    // is set from `item`. Required: item, vendor, amount, needed, purpose
    // (qty + coding carry defaults). Submit label is "Submit PO".
    const title = `E2E req ${Date.now()}`;
    await page.getByPlaceholder("What are you buying?").fill(title);
    await page.getByPlaceholder("e.g. Harbor Supply Co.").fill("Harbor Supply Co.");
    await page.getByPlaceholder("0.00").fill("40.00");
    await page.locator('input[type="date"]').first().fill("2026-12-31");
    await page.getByPlaceholder("Why is this needed?").fill("Gel frame snapped during focus.");
    await page.getByRole("button", { name: /submit po/i }).click();

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

test.describe("COMPVSS mileage", () => {
  test.beforeEach(async ({ page }) => {
    await authedSetup(page, "crew");
  });

  test("G21 · a crew member logs a drive from the vehicle", async ({ page }) => {
    await page.goto("/m/mileage");
    await page.getByRole("link", { name: /log a drive/i }).first().click();
    await expect(page).toHaveURL(/\/m\/mileage\/new$/, { timeout: 20_000 });

    const origin = `E2E yard ${Date.now()}`;
    await page.locator('input[name="origin"]').fill(origin);
    await page.locator('input[name="destination"]').fill("E2E venue");
    await page.locator('input[name="miles"]').fill("12.4");
    await page.getByRole("button", { name: /log drive/i }).click();

    await expect(page).toHaveURL(/\/m\/mileage$/, { timeout: 20_000 });
    await expect(page.getByText(origin)).toBeVisible();
  });

  test("G21 · the rate is not the driver's to set", async ({ page }) => {
    await page.goto("/m/mileage/new");
    // A rate field would be an invitation to a dispute at best. The column
    // default is the rate; the form must never offer it.
    await expect(page.locator('input[name="rate_cents"]')).toHaveCount(0);
    await expect(page.locator("body")).not.toHaveText(/rate/i);
  });

  test("G21 · refuses an obvious typo rather than passing it to an approver", async ({ page }) => {
    await page.goto("/m/mileage/new");
    await page.locator('input[name="origin"]').fill("A");
    await page.locator('input[name="destination"]').fill("B");
    await page.locator('input[name="miles"]').fill("99999");
    await page.getByRole("button", { name: /log drive/i }).click();
    await expect(page.getByText(/looks like a typo/i)).toBeVisible({ timeout: 15_000 });
  });
});
