import { expect, test } from "playwright/test";

test.describe("auth routes", () => {
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

  test("login form renders with OAuth + email/password", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
  });

  test("signup form renders with split layout", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Name" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Work email" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
  });

  test("forgot-password form renders", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
  });

  test("password show/hide toggle works", async ({ page }) => {
    await page.goto("/login");
    const passwordInput = page.getByRole("textbox", { name: "Password" });
    await passwordInput.fill("testpw1234");
    await expect(passwordInput).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(passwordInput).toHaveAttribute("type", "text");
  });

  test("validation surfaces a field error when fields invalid", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("textbox", { name: "Email" }).fill("not-an-email");
    await page.getByRole("textbox", { name: "Password" }).fill("x");
    await page.getByRole("button", { name: /^sign in/i }).click();
    await expect(page.locator('[role="alert"], [aria-invalid="true"]').first()).toBeVisible({
      timeout: 5000,
    });
  });
});
