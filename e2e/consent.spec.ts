import { expect, test } from "playwright/test";

test.describe("cookie consent", () => {
  test.beforeEach(async ({ context }) => {
    // Clear consent cookie so banner shows
    await context.clearCookies();
  });

  test("banner appears on first visit", async ({ page }) => {
    await page.goto("/");
    // Defer 600ms in component
    await expect(page.getByRole("heading", { name: "Cookies & privacy" })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("button", { name: "Accept all" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reject all" })).toBeVisible();
  });

  test("accept all sets consent cookie and dismisses", async ({ page, context }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Accept all" }).click();
    await expect(page.getByRole("heading", { name: "Cookies & privacy" })).not.toBeVisible({
      timeout: 5000,
    });
    const cookies = await context.cookies();
    const consent = cookies.find((c) => c.name === "fbw_consent");
    expect(consent).toBeDefined();
    expect(consent!.value).toContain("essential");
  });

  test("reject all stores essential-only consent", async ({ page, context }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Reject all" }).click();
    await expect(page.getByRole("heading", { name: "Cookies & privacy" })).not.toBeVisible({
      timeout: 5000,
    });
    const cookies = await context.cookies();
    const consent = cookies.find((c) => c.name === "fbw_consent");
    expect(consent).toBeDefined();
    expect(decodeURIComponent(consent!.value)).toMatch(/"analytics":false/);
    expect(decodeURIComponent(consent!.value)).toMatch(/"marketing":false/);
  });

  test("customize panel exposes individual toggles", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Customize" }).click();
    await expect(page.getByRole("checkbox", { name: /toggle analytics/i })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /toggle marketing/i })).toBeVisible();
  });
});
