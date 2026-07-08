import { expect, test } from "playwright/test";
import { dismissConsent, loginAndSwitchWorkspace } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";
import { TEST_ORGS } from "./helpers/fixtures";

/**
 * M9 — LEG3ND signage library CRUD. The heavily-specced 60-AIGA-pictogram
 * surface had zero authoring coverage (render-smoke only). A manager+ creates a
 * sign, sees it in the register, and deletes it (self-cleaning via the confirm
 * dialog). Also the positive control for the manager+ gate on createSignAction.
 */
test.describe("LEG3ND signage — sign CRUD (M9)", () => {
  test.describe.configure({ timeout: 120_000 });

  test("manager+ creates a sign, sees it in the register, deletes it", async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "owner", TEST_ORGS.professional);

    const code = `E2E-SIGN-${stamp()}`;
    // pictogram_key is a free string (min 1) — use a real AIGA id for realism.
    await createInModule(page, "/legend/signage/new", {
      code,
      name: `E2E Sign ${code}`,
      pictogram_key: "aiga-exit",
    });
    const detailUrl = page.url();
    expect(detailUrl, "create redirected to the sign detail").toMatch(/\/legend\/signage\/[0-9a-f-]{36}/i);
    await expect(page.getByText(code).first(), "the new sign renders on its detail").toBeVisible({ timeout: 15_000 });

    // Present in the register.
    await page.goto("/legend/signage");
    await expect(page.getByText(code).first(), "sign listed in the register").toBeVisible({ timeout: 15_000 });

    // Delete from the detail page via the confirm dialog (self-clean).
    await page.goto(detailUrl);
    await page.getByRole("button", { name: /^delete$/i }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await dialog.getByRole("button", { name: /^delete$/i }).click();
    await expect(page).toHaveURL(/\/legend\/signage(\?|$)/, { timeout: 15_000 });
    await expect(page.getByText(code), "deleted sign no longer listed").toHaveCount(0);
  });
});
