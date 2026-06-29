/**
 * Console core interactive flows — create / edit / state-machine coverage for
 * the platform modules that the rest of the suite (marketplace, booking, forms,
 * portal, api) does NOT exercise interactively: Projects, Tasks, Procurement
 * (vendor → requisition → PO + the W-9/COI compliance gate), Finance (budget +
 * invoice receivables lifecycle), Proposals, and Comms (announcement + poll).
 *
 * These mirror the manual browser validations recorded in
 * reports/BROWSER_E2E_CASA_WYNWOOD.md, made repeatable. Each test is
 * self-contained — it creates the records it needs as the seeded `owner`
 * fixture, so it does not depend on pre-existing org data.
 *
 * Selectors are tolerant (role/name + field `name=`), and assertions check the
 * post-submit state (URL change / heading / status badge) rather than exact
 * pixel output, so the specs survive copy tweaks.
 */
import { expect, test, type Page } from "playwright/test";
import { authedSetup } from "./helpers/auth";

const stamp = () => `${Date.now()}`;

/** Fill a native field by its form `name`, React-controlled-input safe. */
async function fillByName(page: Page, name: string, value: string) {
  await page.locator(`[name="${name}"]`).fill(value);
}

/** Submit the page's primary form and wait for the navigation it triggers. */
async function submitForm(page: Page) {
  await Promise.all([
    page.waitForLoadState("networkidle"),
    page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit()),
  ]);
}

test.describe("console core — Projects", () => {
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("create a project lands on a detail page", async ({ page }) => {
    await page.goto("/studio/projects/new");
    const name = `E2E Project ${stamp()}`;
    await fillByName(page, "name", name);
    await submitForm(page);
    // redirect to /studio/projects or the new detail; the name should render
    await expect(page.locator("body")).toContainText(name, { timeout: 15000 });
  });
});

test.describe("console core — Tasks", () => {
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("create a task appears in the list", async ({ page }) => {
    await page.goto("/studio/tasks/new");
    const title = `E2E Task ${stamp()}`;
    await fillByName(page, "title", title);
    await submitForm(page);
    await expect(page.locator("body")).toContainText(title, { timeout: 15000 });
  });
});

test.describe("console core — Finance invoice receivables lifecycle", () => {
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("invoice draft → sent → paid", async ({ page }) => {
    await page.goto("/studio/finance/invoices/new");
    const title = `E2E Invoice ${stamp()}`;
    await fillByName(page, "title", title);
    // Amount is a <MoneyInput>: a visible decimal field (placeholder "0.00")
    // that writes integer cents to a hidden input[name="amount_cents"]. Fill
    // the visible field with dollars — "123.45" → 12345 cents.
    await page.getByPlaceholder("0.00").fill("123.45");
    await submitForm(page);
    // on the detail page now
    await expect(page.locator("h1")).toContainText(title, { timeout: 15000 });
    await expect(page.getByText(/draft/i).first()).toBeVisible();
    // draft → sent
    await page.getByRole("button", { name: /send invoice/i }).click();
    await expect(page.getByText(/\bsent\b/i).first()).toBeVisible({ timeout: 15000 });
    // sent → paid
    await page.getByRole("button", { name: /mark paid/i }).click();
    await expect(page.getByText(/\bpaid\b/i).first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("console core — Procurement W-9/COI gate", () => {
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("compliant vendor → PO binds and Send succeeds", async ({ page }) => {
    // 1. compliant vendor (W-9 on file + future COI)
    await page.goto("/studio/procurement/vendors/new");
    const vendor = `E2E Vendor ${stamp()}`;
    await fillByName(page, "name", vendor);
    await fillByName(page, "coi_expires_at", "2030-01-01");
    await page.locator('[name="w9"]').check();
    await submitForm(page);
    await expect(page.locator("body")).toContainText(vendor, { timeout: 15000 });

    // 2. PO bound to that vendor
    await page.goto("/studio/procurement/purchase-orders/new");
    await fillByName(page, "title", `E2E PO ${stamp()}`);
    await page.locator('[name="vendor_id"]').selectOption({ label: vendor });
    await fillByName(page, "amount", "5000");
    await submitForm(page);
    await expect(page.getByText(/draft/i).first()).toBeVisible({ timeout: 15000 });

    // 3. Send PO — the compliance gate should PASS (vendor is compliant)
    await page.getByRole("button", { name: /send po/i }).click();
    await expect(page.getByText(/\bsent\b/i).first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("console core — Proposals lifecycle", () => {
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("proposal draft → sent → approved", async ({ page }) => {
    await page.goto("/studio/proposals/new");
    const title = `E2E Proposal ${stamp()}`;
    await fillByName(page, "title", title);
    // amount/value field name varies; fill any required number field present
    const amount = page.locator('input[type="number"]').first();
    if (await amount.count()) await amount.fill("100000");
    await submitForm(page);
    await expect(page.locator("h1")).toContainText(title, { timeout: 15000 });
    const send = page.getByRole("button", { name: /send to client/i });
    if (await send.count()) {
      await send.click();
      await expect(page.getByText(/\bsent\b/i).first()).toBeVisible({ timeout: 15000 });
      await page.getByRole("button", { name: /mark approved/i }).click();
      await expect(page.getByText(/\bapproved\b/i).first()).toBeVisible({ timeout: 15000 });
    }
  });
});

test.describe("console core — Comms", () => {
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("announcement create → publish", async ({ page }) => {
    await page.goto("/studio/comms/announcements/new");
    const title = `E2E Announcement ${stamp()}`;
    await fillByName(page, "title", title);
    await page.locator('textarea[name="body"]').fill("E2E body copy for the announcement.");
    await submitForm(page);
    await expect(page.locator("h1")).toContainText(title, { timeout: 15000 });
    await page.getByRole("button", { name: /^publish$/i }).click();
    await expect(page.getByText(/published/i).first()).toBeVisible({ timeout: 15000 });
  });

  test("poll create → publish", async ({ page }) => {
    await page.goto("/studio/comms/polls/new");
    const q = `E2E Poll ${stamp()}`;
    await fillByName(page, "question", q);
    await page.locator('textarea[name="options"]').fill("Option A\nOption B\nOption C");
    const pub = page.locator('[name="publish_now"]');
    if (await pub.count()) await pub.check();
    await submitForm(page);
    await expect(page.locator("h1")).toContainText(q, { timeout: 15000 });
    await expect(page.getByText(/\blive\b/i).first()).toBeVisible({ timeout: 15000 });
  });
});
