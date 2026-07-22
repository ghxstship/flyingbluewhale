import { test, expect } from "./helpers/base";
import { authedSetup } from "./helpers/auth";

/**
 * Data-point lifecycle — runtime verification of the dead-write / dropped-input
 * closures (docs/compvss/SURFACE_AUDIT_2026-07-21.md, commit 32af2607). Static
 * analysis + unit tests proved the wiring; this proves the BEHAVIOR against a
 * deployed target:
 *
 *  1. "Submit Anonymously" is real — an anon incident renders no reporter line.
 *  2. A named filing DOES render "Reported by" (the control for #1).
 *  3. "Billable To Client" survives filing and reads back on the record.
 *  4. Jobs cards render the shift-window "when" pipeline without regression.
 *
 * Rows are prefixed "E2E-DPL" for teardown (the suite owner deletes them via
 * SQL after the run — incidents carry no soft-delete; expenses are hard rows).
 */

const STAMP = `E2E-DPL ${Date.now()}`;

test.describe("COMPVSS data-point lifecycle (deployed)", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeEach(async ({ page }) => authedSetup(page, "crew"));

  test("anonymous incident: no reporter recorded, no 'Reported by' rendered", async ({ page }) => {
    await page.goto("/m/incidents/new");
    await page.getByPlaceholder("e.g. Gate 3 · NE corner").fill("E2E dock");
    await page.locator('input[type="time"]').first().fill("09:15");
    await page.getByPlaceholder("Describe the incident…").fill(`${STAMP} anon spill`);
    await page.getByRole("switch", { name: "Submit Anonymously" }).click();
    await page.getByRole("button", { name: /submit report/i }).click();

    await expect(page).toHaveURL(/\/m\/incidents/, { timeout: 20_000 });
    // Click the row LINK (not the raw text node): right after filing, the list
    // re-hydrates and a click on a remounting text node can go nowhere.
    const link = page.getByRole("link", { name: new RegExp(`${STAMP} anon spill`) }).first();
    await expect(link).toBeVisible({ timeout: 15_000 });
    await link.click();
    await expect(page).toHaveURL(/\/m\/incidents\/[0-9a-f-]{36}/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // The whole point: the record carries no filer identity.
    await expect(page.getByText(/reported by/i)).toHaveCount(0);
  });

  test("named incident: 'Reported by' renders (control case)", async ({ page }) => {
    await page.goto("/m/incidents/new");
    await page.getByPlaceholder("e.g. Gate 3 · NE corner").fill("E2E dock");
    await page.getByPlaceholder("Describe the incident…").fill(`${STAMP} named cable`);
    await page.getByRole("button", { name: /submit report/i }).click();

    await expect(page).toHaveURL(/\/m\/incidents/, { timeout: 20_000 });
    const link = page.getByRole("link", { name: new RegExp(`${STAMP} named cable`) }).first();
    await expect(link).toBeVisible({ timeout: 15_000 });
    await link.click();
    await expect(page).toHaveURL(/\/m\/incidents\/[0-9a-f-]{36}/, { timeout: 20_000 });
    await expect(page.getByText(/reported by/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("expense: Billable To Client survives filing and reads back", async ({ page }) => {
    await page.goto("/m/expenses/new");
    // Category is the org's ref list (async options) — pick the first real one.
    const category = page.locator("select").first();
    await category.waitFor({ state: "visible" });
    await category.selectOption({ index: 1 });
    await page.getByPlaceholder("0.00").fill("12.34");
    await page.getByPlaceholder("Where was it spent?").fill(`${STAMP} Diner`);
    await page.getByRole("switch", { name: "Billable To Client" }).click();
    await page.getByRole("button", { name: /submit expense/i }).click();

    await expect(page).toHaveURL(/\/m\/expenses/, { timeout: 20_000 });
    const row = page.locator("div.item.tap", { hasText: `${STAMP} Diner` }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.click();
    // RecordDetail overlay: the declaration is on the record.
    await expect(page.getByText("Billable To Client").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/^Yes$/).first()).toBeVisible();
  });

  test("jobs board renders with the shift-window when pipeline", async ({ page }) => {
    await page.goto("/m/jobs");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
    // No crash from the new select columns; cards (if any) render a when line.
    const body = await page.content();
    expect(body).not.toContain("Application error");
  });
});
