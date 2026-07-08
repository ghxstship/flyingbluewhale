import { expect, test } from "playwright/test";
import { dismissConsent, loginAndSwitchWorkspace } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";
import { TEST_ORGS } from "./helpers/fixtures";

/**
 * H4 — LEG3ND XMCE compliance-engine CRUD. The audit found the compliance
 * ENGINE itself (authoring a rule) had zero e2e — only the dashboard was
 * render-smoked. This drives the operator flow the engine exists for: a
 * manager+ creates a compliance rule, sees it in the XMCE register, and deletes
 * it. Self-cleaning (unique stamped code + delete) so the shared org stays tidy.
 *
 * Also the positive control for the D2 gate: /legend/engine/rules/new + its
 * action are manager+ only (authz-matrix.spec.ts asserts the denial side).
 */
test.describe("LEG3ND XMCE — compliance rule CRUD (H4)", () => {
  test.describe.configure({ timeout: 120_000 });

  test("manager+ creates a compliance rule, sees it in the register, deletes it", async ({ page }) => {
    // Accept any native confirm the delete control might raise.
    page.on("dialog", (d) => void d.accept().catch(() => {}));
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "owner", TEST_ORGS.professional);

    const code = `E2E-XMCE-${stamp()}`;

    // Create — the /new page and its action are manager+ gated (D2).
    await createInModule(page, "/legend/engine/rules/new", { code, title: `E2E XMCE Rule ${code}` });
    const detailUrl = page.url();
    expect(detailUrl, "create redirected to the rule detail").toMatch(/\/legend\/engine\/rules\/[0-9a-f-]{36}/i);
    await expect(page.getByText(code).first(), "the new rule renders on its detail").toBeVisible({ timeout: 15_000 });

    // It appears in the XMCE rules register.
    await page.goto("/legend/engine/rules");
    await expect(page.getByText(code).first(), "rule listed in the register").toBeVisible({ timeout: 15_000 });

    // Delete from the detail page → server-side redirect back to the list.
    await page.goto(detailUrl);
    await page.getByRole("button", { name: /^delete$/i }).click();
    await expect(page).toHaveURL(/\/legend\/engine\/rules(\?|$)/, { timeout: 15_000 });
    await expect(page.getByText(code), "deleted rule no longer listed").toHaveCount(0);
  });
});
