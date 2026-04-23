import { expect, test } from "playwright/test";

test.describe("marketing", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: "fbw_consent",
        value: encodeURIComponent(
          JSON.stringify({
            essential: true,
            analytics: false,
            marketing: false,
            decidedAt: new Date().toISOString(),
          }),
        ),
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test("home renders hero + CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /^start free/i }).first()).toBeVisible();
  });

  test("pricing shows 4 tiers + comparison table", async ({ page }) => {
    await page.goto("/pricing");
    // Tier rename (fbw_022 / 2026-04-19): Portal → Access, Starter → Core.
    for (const tier of ["Access", "Core", "Professional", "Enterprise"]) {
      await expect(page.getByText(tier, { exact: false }).first()).toBeVisible();
    }
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("solutions index renders 3 apps", async ({ page }) => {
    await page.goto("/solutions");
    await expect(page.getByText(/atlvs/i).first()).toBeVisible();
    await expect(page.getByText(/gvteway/i).first()).toBeVisible();
    await expect(page.getByText(/compvss/i).first()).toBeVisible();
  });

  test("compare page lists 3 competitors", async ({ page }) => {
    await page.goto("/compare");
    await expect(page.getByRole("link", { name: /asana/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /monday/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /spreadsheets/i })).toBeVisible();
  });

  test("guides + blog + community each list at least one entry", async ({ page }) => {
    for (const path of ["/guides", "/blog", "/community"]) {
      await page.goto(path);
      await expect(page.getByRole("link").first()).toBeVisible();
    }
  });

  test("footer has 5 nav columns", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    for (const heading of ["Product", "Industries", "Resources", "Company", "Legal"]) {
      await expect(footer.getByText(heading, { exact: true })).toBeVisible();
    }
  });

  test("sitemap + robots serve", async ({ request }) => {
    const r1 = await request.get("/robots.txt");
    expect(r1.ok()).toBeTruthy();
    const r2 = await request.get("/sitemap.xml");
    expect(r2.ok()).toBeTruthy();
  });
});
