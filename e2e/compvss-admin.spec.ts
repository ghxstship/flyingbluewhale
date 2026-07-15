/**
 * COMPVSS org admin (audit S1 / G18).
 *
 * The mobile shell had exactly one role gate (`isManagerPlus`) and no
 * isAdmin/isOwner call site at all, so an owner on site could do nothing
 * administrative. These are the first admin gates in the field app, and
 * they are authorization surfaces — the refusal path matters as much as
 * the happy path, so both are asserted.
 */
import { expect, test } from "./helpers/base";
import { authedSetup } from "./helpers/auth";

test.describe("COMPVSS team admin", () => {
  test("an admin can reach Team and the invite form", async ({ page }) => {
    await authedSetup(page, "admin");
    await page.goto("/m/settings/team");

    await expect(page.getByRole("heading", { name: /^team$/i })).toBeVisible();
    // The roster renders real members, not a stub.
    await expect(page.locator(".item").first()).toBeVisible();

    await page.getByRole("link", { name: /invite someone/i }).click();
    await expect(page).toHaveURL(/\/m\/settings\/team\/invite$/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('select[name="role"]')).toBeVisible();
  });

  test("a crew member is refused Team, and told why", async ({ page }) => {
    await authedSetup(page, "crew");
    await page.goto("/m/settings/team");

    // Hiding is UX; the surface itself must refuse. A blank screen would
    // read as a bug, so the refusal is explicit.
    await expect(page.getByText(/owners and admins only/i)).toBeVisible();
    await expect(page.locator(".item")).toHaveCount(0);
  });

  test("the More hub only offers Team to admins", async ({ page }) => {
    await authedSetup(page, "crew");
    await page.goto("/m/more");
    await expect(page.getByRole("link", { name: /^team$/i })).toHaveCount(0);
  });
});
