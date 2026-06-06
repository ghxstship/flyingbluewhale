import { expect, test } from "playwright/test";

test.describe("cookie consent", () => {
  test.beforeEach(async ({ context }) => {
    // Clear consent cookie so banner shows
    await context.clearCookies();
  });

  // Canonical consent cookie name after the brand sweep — see COOKIE_NAME in
  // src/components/compliance/CookieConsent.tsx (legacy fbw_consent is read-only).
  const CONSENT_COOKIE = "atlvs_consent";

  test("banner appears on first visit", async ({ page }) => {
    await page.goto("/");
    // Defer 600ms in component
    await expect(page.getByRole("heading", { name: "Cookies & privacy" })).toBeVisible({
      timeout: 5000,
    });
    // Button labels are Title Case ("Accept All" / "Reject All").
    await expect(page.getByRole("button", { name: "Accept All" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reject All" })).toBeVisible();
  });

  test("accept all sets consent cookie and dismisses", async ({ page, context }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Accept All" }).click();
    await expect(page.getByRole("heading", { name: "Cookies & privacy" })).not.toBeVisible({
      timeout: 5000,
    });
    const cookies = await context.cookies();
    const consent = cookies.find((c) => c.name === CONSENT_COOKIE);
    expect(consent).toBeDefined();
    expect(consent!.value).toContain("essential");
  });

  test("reject all stores essential-only consent", async ({ page, context }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Reject All" }).click();
    await expect(page.getByRole("heading", { name: "Cookies & privacy" })).not.toBeVisible({
      timeout: 5000,
    });
    const cookies = await context.cookies();
    const consent = cookies.find((c) => c.name === CONSENT_COOKIE);
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
