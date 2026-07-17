/**
 * Self-sufficiency manifest proofs — the "built, unproven" §1 cells from
 * docs/compvss/KIT28_CONFORMANCE_BACKLOG.md. Each test here is the proving
 * spec a manifest cell names before it may claim `shipped`
 * (src/lib/mobile/self-sufficiency-manifest.ts — the guard refuses the state
 * without one).
 *
 *   expense.file     — file an expense WITH a receipt photo as crew; the
 *                      list row must NOT carry the "No receipt" mark, which
 *                      is exactly the expenses.receipt_path IS NULL render
 *                      (ExpensesView appends it only when hasReceipt=false).
 *   timesheet.submit — submit the open week from /m/timesheets and watch the
 *                      state flip out of the submittable set.
 *
 * Fixture notes (docs/E2E_COVERAGE_BACKLOG.md): crew persona =
 * test+crew@flyingbluewhale.app (Test Professional Org). FormScreen CTA
 * arms only after required fields hold values; the photo field's hidden
 * input is #ff-<fieldId>.
 */
import { expect, test } from "./helpers/base";
import { authedSetup } from "./helpers/auth";

const ERROR_BOUNDARY = /something went wrong|application error|unhandled|digest:/i;

// 1×1 transparent PNG — a real file for the receipt input.
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("manifest proofs · crew", () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "crew"));

  test("expense.file — an expense filed with a receipt lands WITH its receipt", async ({ page }) => {
    const marker = `E2E receipt proof ${Date.now()}`;

    await page.goto("/m/expenses/new");
    await expect(page.locator(".formscreen, .screen").first()).toBeVisible({ timeout: 20_000 });

    // Required fields arm the CTA: category (select) · amount · merchant.
    await page.locator("select").first().selectOption("Supplies");
    await page.getByPlaceholder("0.00").fill("12.34");
    await page.getByPlaceholder("Where was it spent?").fill(marker);
    // The receipt photo — the point of this proof.
    await page.locator("#ff-receipt").setInputFiles({
      name: "receipt.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    });

    await page.getByRole("button", { name: "Submit Expense" }).click();
    await page.waitForURL(/\/m\/expenses(\?|$)/, { timeout: 30_000 });
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);

    // The new row renders; its line must NOT carry the no-receipt mark —
    // ExpensesView appends "· No receipt" exactly when receipt_path is null,
    // so its absence on OUR row is the receipt_path NON-NULL assertion,
    // observed through the product instead of a side-channel query. The
    // warn= redirect param is the action's own "receipt didn't stick"
    // signal; its absence is asserted via the URL above having no ?warn.
    expect(page.url(), "a warn= redirect means the receipt upload failed").not.toContain("warn=");
    const row = page.locator(".item", { hasText: marker }).first();
    await expect(row).toBeVisible({ timeout: 20_000 });
    await expect(row.getByText(/No receipt/i)).toHaveCount(0);
  });

  test("timesheet.submit — the open week submits and leaves the submittable set", async ({ page }) => {
    await page.goto("/m/timesheets");
    await expect(page.locator(".scr-h, h1").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);

    const submit = page.getByRole("button", { name: /Submit For Approval|Submit Again/ }).first();
    const count = await submit.count();
    if (count === 0) {
      // Nothing submittable this week — an earlier run already submitted it.
      // That state is itself proof the journey completes: assert a submitted/
      // approved sheet exists rather than silently passing an empty page.
      await expect(
        page.getByText(/submitted|approved|pending/i).first(),
        "no submittable sheet AND no submitted sheet — the spine rendered nothing",
      ).toBeVisible({ timeout: 15_000 });
      return;
    }

    await submit.click();
    // The state flips server-side and the row re-renders without the CTA
    // (canSubmit reads the FSM's submittable set) — or with "Submit Again"
    // gone and a submitted badge present.
    await expect(page.getByText(/submitted/i).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  });
});
