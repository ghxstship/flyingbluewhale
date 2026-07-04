/**
 * Kit 20 console-identity acceptance coverage (REPO_LANDING.md §4).
 *
 * Locks the landed contract in CI: the verbatim rail, the auto second
 * shelf, the fixture-01 Home surfaces, the eight kit-20 lens pages, role
 * lenses, the two-pane inbox with record-ref chips, and the utility
 * surfaces that keep every pre-kit URL alive. Data-light by design —
 * every assertion holds on an empty org (empty states are part of the
 * zero-training contract), so the spec runs against any seeded target
 * including prod via E2E_BASE_URL.
 */
import { expect, test } from "playwright/test";
import { authedSetup } from "./helpers/auth";
import { stamp } from "./helpers/forms";

test.describe("kit 20 · verbatim rail + second shelf", () => {
  test.beforeEach(async ({ page }) => {
    await authedSetup(page, "owner");
  });

  test("the rail renders the kit group set", async ({ page }) => {
    await page.goto("/studio");
    const nav = page.getByRole("complementary", { name: "Primary" });
    // Group headers are collapse toggles — assert them as buttons.
    for (const group of [
      "Sales",
      "Talent",
      "Projects",
      "Procurement",
      "Production",
      "People",
      "Operations",
      "Safety",
      "Finance",
      "Comms",
    ]) {
      await expect(nav.getByRole("button", { name: group, exact: true })).toBeVisible();
    }
    // Home cluster items render expanded by default.
    for (const item of ["Dashboard", "My Inbox", "My Work", "My Calendar", "Reports", "Insights"]) {
      await expect(nav.getByRole("link", { name: item, exact: true }).first()).toBeVisible();
    }
  });

  test("tab families auto-render on member routes", async ({ page }) => {
    await page.goto("/studio/crm");
    const shelf = page.locator(".module-header-tabs");
    for (const tab of ["CRM", "Leads", "Opportunities"]) {
      await expect(shelf.getByRole("tab", { name: tab })).toBeVisible();
    }

    await page.goto("/studio/schedule");
    for (const tab of ["Schedule", "Calendar", "Event Orders", "Meetings"]) {
      await expect(page.locator(".module-header-tabs").getByRole("tab", { name: tab })).toBeVisible();
    }
  });

  test("home carries the fixture-01 surfaces", async ({ page }) => {
    await page.goto("/studio");
    // Show-Day Mode pill (persisted live-ops toggle).
    await expect(page.getByRole("button", { name: /show-day mode/i })).toBeVisible();
    // World clocks row.
    await expect(page.getByText("Miami", { exact: true })).toBeVisible();
    await expect(page.getByText("Denver", { exact: true })).toBeVisible();
    // One Front Door quick actions.
    await expect(page.getByRole("link", { name: "Gear & Advance" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Purchase Requisition" })).toBeVisible();
    // Overview tab family on the home shelf.
    await expect(page.locator(".module-header-tabs").getByRole("tab", { name: "Sustainability" })).toBeVisible();
  });

  test("the eight kit-20 lens pages render real surfaces", async ({ page }) => {
    const pages: Array<[string, RegExp]> = [
      ["/studio/marketplace/submissions", /submissions/i],
      ["/studio/advancing", /advancing/i],
      ["/studio/compliance", /compliance/i],
      ["/studio/compliance/permits", /permits/i],
      ["/studio/safety/lost-found", /lost & found/i],
      ["/studio/access-control/counts", /crowd counts/i],
      ["/studio/finance/auto-invoicing", /auto-invoicing/i],
      ["/studio/finance/budgets/variance", /variance/i],
    ];
    for (const [path, title] of pages) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    }
  });

  test("role lens scopes the rail to the kit preset", async ({ page }) => {
    await page.goto("/studio");
    const nav = page.getByRole("complementary", { name: "Primary" });
    const lens = nav.locator("select").first();
    await lens.selectOption("Crew");
    // Crew lens = Home · Operations · People · Comms.
    await expect(nav.getByRole("button", { name: "People", exact: true })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Operations", exact: true })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Procurement", exact: true })).toHaveCount(0);
    await expect(nav.getByRole("button", { name: "Finance", exact: true })).toHaveCount(0);
    await lens.selectOption("All");
    await expect(nav.getByRole("button", { name: "Procurement", exact: true })).toBeVisible();
  });

  test("utility surfaces survive off the rail", async ({ page }) => {
    for (const path of ["/studio/copilot", "/studio/triage", "/studio/position"]) {
      const res = await page.goto(path);
      expect(res?.status(), `${path} should render`).toBe(200);
    }
  });
});

test.describe("kit 20 · two-pane inbox", () => {
  test.beforeEach(async ({ page }) => {
    await authedSetup(page, "owner");
  });

  test("channel create → Enter-send → record-ref chip", async ({ page }) => {
    await page.goto("/studio/inbox");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/my inbox/i);

    // New Channel intake (M2).
    const name = `E2E Ops ${stamp()}`;
    await page.getByText("+ New Channel").click();
    await page.getByLabel("Channel Name").fill(name);
    await page.getByRole("button", { name: /^create$/i }).click();
    await page.waitForURL(/\/studio\/inbox\?room=/, { timeout: 15000 });
    await expect(page.getByText(name).first()).toBeVisible();

    // Enter sends (M1) and a pasted console link chips (M-series refs).
    const composer = page.getByPlaceholder(/message/i);
    await composer.fill("Chip check /studio/finance/invoices please");
    await composer.press("Enter");
    const chip = page.locator("main a", { hasText: "Invoices" }).last();
    await expect(chip).toBeVisible({ timeout: 15000 });
    await expect(chip).toHaveAttribute("href", "/studio/finance/invoices");
  });
});
