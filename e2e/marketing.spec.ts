import { expect, test } from "playwright/test";

test.describe("marketing", () => {
  test("home renders hero + CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Run production");
    await expect(page.getByRole("link", { name: /Start free/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Talk to sales/i })).toBeVisible();
  });

  test("pricing shows 4 tiers", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("h1")).toContainText("Pick a tier");
    for (const tier of ["Portal", "Starter", "Professional", "Enterprise"]) {
      await expect(page.getByText(tier, { exact: false })).toBeVisible();
    }
  });

  test("sitemap + robots serve", async ({ request }) => {
    const r1 = await request.get("/robots.txt");
    expect(r1.ok()).toBeTruthy();
    const r2 = await request.get("/sitemap.xml");
    expect(r2.ok()).toBeTruthy();
  });
});
