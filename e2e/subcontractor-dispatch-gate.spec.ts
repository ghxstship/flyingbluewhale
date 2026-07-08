import { test, expect } from "./helpers/base";
import { dismissConsent, loginAndSwitchWorkspace } from "./helpers/auth";
import { DISPATCH_FIXTURE as D } from "./helpers/fixtures";

/**
 * H5 — subcontractor eligibility-GATED dispatch (the v7.5 headline feature the
 * audit found had no positive OR negative functional assertion). Award of a work
 * order is blocked for a sub whose v_sub_eligibility verdict for the trade is
 * `blocked` (missing/expired required compliance docs) — enforced server-side in
 * awardWorkOrderAction AND surfaced in the UI as a disabled Award control.
 *
 * Fixture (e2e/helpers/fixtures.ts): a posted work order on `e2e-trade` (which
 * requires a COI) with two bids — a BLOCKED sub (W9 on file, no COI) and an
 * ELIGIBLE sub (current COI). Non-destructive: asserts the gate's UI state; no
 * award is submitted.
 */
test.describe("Subcontractor dispatch — eligibility gate (H5)", () => {
  test.describe.configure({ timeout: 120_000 });

  test("a blocked sub cannot be awarded; an eligible sub can", async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "owner", D.orgId);
    await page.goto(`/studio/production/work-orders/${D.workOrderId}`);

    const blockedRow = page.locator("li", { hasText: D.blockedVendorName });
    const eligibleRow = page.locator("li", { hasText: D.eligibleVendorName });
    await expect(blockedRow, "the blocked sub's bid is listed").toBeVisible({ timeout: 15_000 });
    await expect(eligibleRow, "the eligible sub's bid is listed").toBeVisible();

    // Blocked sub: Blocked verdict + Award disabled (the gate).
    await expect(blockedRow.getByText(/^blocked$/i), "blocked sub shows the Blocked verdict").toBeVisible();
    await expect(
      blockedRow.getByRole("button", { name: /award/i }),
      "a blocked sub cannot be awarded — the eligibility gate holds",
    ).toBeDisabled();

    // Eligible sub: Eligible verdict + Award enabled.
    await expect(eligibleRow.getByText(/^eligible$/i), "eligible sub shows the Eligible verdict").toBeVisible();
    await expect(
      eligibleRow.getByRole("button", { name: /award/i }),
      "an eligible sub can be awarded",
    ).toBeEnabled();
  });
});
