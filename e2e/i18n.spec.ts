import { expect, test } from "playwright/test";

test.describe("i18n + a11y root", () => {
  test("html has lang + dir attributes", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", /^[a-z]{2}$/);
    await expect(html).toHaveAttribute("dir", /^(ltr|rtl)$/);
  });

  test("respects locale cookie when set", async ({ context, page }) => {
    await context.addCookies([
      { name: "locale", value: "es", domain: "localhost", path: "/" },
    ]);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
  });

  test("switches to RTL when ar locale active", async ({ context, page }) => {
    await context.addCookies([
      { name: "locale", value: "ar", domain: "localhost", path: "/" },
    ]);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("skip link is keyboard-accessible", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.textContent);
    expect(focused).toMatch(/skip to content/i);
  });
});
