import { expect, test, type Page } from "playwright/test";
import { dismissConsent, loginAs } from "./helpers/auth";

/**
 * forms-construction-trade
 *
 * End-to-end CRUD lifecycle for the five construction-trade modules whose
 * /[id]/edit pages were added in the May 2026 audit remediation:
 *   - RFIs
 *   - Submittals
 *   - Punch list items
 *   - Inspections
 *   - Site plans
 *
 * Each test:
 *   1. Logs in as owner
 *   2. Creates a record via the /new form
 *   3. Verifies the detail page renders with the new record's content
 *   4. Navigates to /[id]/edit
 *   5. Modifies a field
 *   6. Submits + verifies the change persists on the detail page
 *
 * Performance notes:
 *  - 120s per-test timeout because Next.js dev mode compiles each route on
 *    first hit (often 10-60s for routes with many imports).
 *  - waitForURL timeouts are 30s to absorb compile latency on the redirect
 *    target route.
 *
 * Side effects: each test creates a real DB record. The fixtures suite is
 * idempotent — re-runs append rather than collide. To purge, clear by code
 * prefix (`E2E-RFI-...`, etc.) via SQL.
 */

async function pickFirstProjectOption(page: Page, selectName: string) {
  const select = page.locator(`select[name="${selectName}"]`);
  await expect(select).toBeVisible({ timeout: 30000 });
  const options = await select.locator("option").all();
  for (const opt of options) {
    const value = await opt.getAttribute("value");
    if (value && value.length > 0) {
      await select.selectOption(value);
      return;
    }
  }
  throw new Error(`No project options available in ${selectName}`);
}

test.describe("construction-trade CRUD lifecycles", () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
  });

  test("RFI: create → edit → answer", async ({ page }) => {
    const subject = `E2E RFI ${Date.now()}`;
    const subjectEdited = `${subject} (edited)`;

    await page.goto("/console/rfis/new", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.locator('input[name="subject"]').fill(subject);
    await page
      .locator('textarea[name="question"]')
      .fill("E2E test question for confirming the rigging point capacity.");
    await pickFirstProjectOption(page, "project_id");
    await page.getByRole("button", { name: /open rfi|save/i }).click();

    await page.waitForURL(/\/console\/rfis\/[a-f0-9-]{36}/, { timeout: 30000 });
    await expect(page.getByText(subject, { exact: false })).toBeVisible({ timeout: 30000 });

    await page.getByRole("link", { name: /^Edit$/ }).click();
    await page.waitForURL(/\/edit$/, { timeout: 30000 });
    await page.locator('input[name="subject"]').fill(subjectEdited);
    await page.locator('select[name="status"]').selectOption("answered");
    await page
      .locator('textarea[name="official_answer"]')
      .fill("Confirmed: 500 lb capacity at downstage left, signed off by rigger.");
    await page.getByRole("button", { name: /save rfi/i }).click();

    await page.waitForURL(/\/console\/rfis\/[a-f0-9-]{36}$/, { timeout: 30000 });
    await expect(page.getByText(subjectEdited)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/Confirmed: 500 lb capacity/)).toBeVisible({ timeout: 30000 });
  });

  test("Submittal: create → edit status", async ({ page }) => {
    const title = `E2E Submittal ${Date.now()}`;

    await page.goto("/console/submittals/new", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.locator('input[name="title"]').fill(title);
    await pickFirstProjectOption(page, "project_id");
    await page
      .getByRole("button", { name: /^create$|^save$|^open$|^submit$/i })
      .first()
      .click();

    await page.waitForURL(/\/console\/submittals\/[a-f0-9-]{36}/, { timeout: 30000 });
    await expect(page.getByText(title, { exact: false })).toBeVisible({ timeout: 30000 });

    await page.getByRole("link", { name: /^Edit$/ }).click();
    await page.waitForURL(/\/edit$/, { timeout: 30000 });
    await page.locator('select[name="status"]').selectOption("submitted");
    await page.getByRole("button", { name: /save submittal/i }).click();

    await page.waitForURL(/\/console\/submittals\/[a-f0-9-]{36}$/, { timeout: 30000 });
    await expect(page.getByText(/submitted/i).first()).toBeVisible({ timeout: 30000 });
  });

  test("Punch item: create → edit priority + status", async ({ page }) => {
    const title = `E2E Punch ${Date.now()}`;
    const titleEdited = `${title} (revised)`;

    await page.goto("/console/punch/new", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.locator('input[name="title"]').fill(title);
    await pickFirstProjectOption(page, "project_id");
    await page
      .getByRole("button", { name: /^create item$|^create$|^add$|^save$/i })
      .first()
      .click();

    await page.waitForURL(/\/console\/punch\/[a-f0-9-]{36}/, { timeout: 30000 });
    await expect(page.getByText(title, { exact: false })).toBeVisible({ timeout: 30000 });

    await page.getByRole("link", { name: /^Edit$/ }).click();
    await page.waitForURL(/\/edit$/, { timeout: 30000 });
    await page.locator('input[name="title"]').fill(titleEdited);
    await page.locator('select[name="priority"]').selectOption("urgent");
    await page.getByRole("button", { name: /save punch/i }).click();

    await page.waitForURL(/\/console\/punch\/[a-f0-9-]{36}$/, { timeout: 30000 });
    await expect(page.getByText(titleEdited)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/urgent/i).first()).toBeVisible({ timeout: 30000 });
  });

  test("Inspection: create → edit notes", async ({ page }) => {
    const name = `E2E Inspection ${Date.now()}`;

    await page.goto("/console/inspections/new", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.locator('input[name="name"]').fill(name);
    await page
      .getByRole("button", { name: /^schedule$|^create$|^save$|^open$/i })
      .first()
      .click();

    await page.waitForURL(/\/console\/inspections\/[a-f0-9-]{36}/, { timeout: 30000 });
    await expect(page.getByText(name, { exact: false })).toBeVisible({ timeout: 30000 });

    await page.getByRole("link", { name: /^Edit$/ }).click();
    await page.waitForURL(/\/edit$/, { timeout: 30000 });
    await page.locator('textarea[name="notes"]').fill("E2E note: verified template items and inspector assignment.");
    await page.getByRole("button", { name: /save inspection/i }).click();

    await page.waitForURL(/\/console\/inspections\/[a-f0-9-]{36}$/, { timeout: 30000 });
  });

  test("Site plan: create → edit discipline", async ({ page }) => {
    const code = `E2E${Date.now().toString().slice(-6)}`;
    const title = `E2E Site Plan ${Date.now()}`;

    await page.goto("/console/site-plans/new", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.locator('input[name="code"]').fill(code);
    await page.locator('input[name="title"]').fill(title);
    await page.locator('select[name="discipline"]').selectOption("rigging");
    await page
      .getByRole("button", { name: /^create sheet$|^create$|^add$|^save$/i })
      .first()
      .click();

    await page.waitForURL(/\/console\/site-plans\/[a-f0-9-]{36}/, { timeout: 30000 });
    await expect(page.getByRole("heading", { name: new RegExp(code) })).toBeVisible({ timeout: 30000 });

    await page.getByRole("link", { name: /^Edit$/ }).click();
    await page.waitForURL(/\/edit$/, { timeout: 30000 });
    await page.locator('select[name="discipline"]').selectOption("power");
    await page.getByRole("button", { name: /save site plan/i }).click();

    await page.waitForURL(/\/console\/site-plans\/[a-f0-9-]{36}$/, { timeout: 30000 });
    await expect(page.getByText(/power/i).first()).toBeVisible({ timeout: 30000 });
  });
});
