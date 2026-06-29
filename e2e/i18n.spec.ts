import { expect, test } from "playwright/test";

// Scope cookies to the active target host (baseURL) — NOT a hardcoded
// `domain: "localhost"`, which silently isn't sent when the suite runs against a
// deployed target via E2E_BASE_URL (e.g. https://atlvs.pro), so the locale never
// reaches prod and the page stays en/ltr. Same fix as helpers/auth#dismissConsent.
const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

test.describe("i18n + a11y root", () => {
  test("html has lang + dir attributes", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", /^[a-z]{2}$/);
    await expect(html).toHaveAttribute("dir", /^(ltr|rtl)$/);
  });

  test("respects locale cookie when set", async ({ context, page }) => {
    await context.addCookies([{ name: "locale", value: "es", url: BASE_URL }]);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
  });

  test("switches to RTL when ar locale active", async ({ context, page }) => {
    await context.addCookies([{ name: "locale", value: "ar", url: BASE_URL }]);
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
