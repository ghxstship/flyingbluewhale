import { expect, test } from "playwright/test";

test.describe("auth routes", () => {
  test("login form renders with OAuth + email/password", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    // OAuth buttons present
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
  });

  test("signup form renders with split layout", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Work email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("forgot-password form renders", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("password show/hide toggle works", async ({ page }) => {
    await page.goto("/login");
    const passwordInput = page.getByLabel("Password");
    await passwordInput.fill("testpw1234");
    await expect(passwordInput).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(passwordInput).toHaveAttribute("type", "text");
  });

  test("validation surfaces a top-level alert when fields invalid", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill("x");
    await page.getByRole("button", { name: /^sign in/i }).click();
    // Either an inline field error or top alert appears
    await expect(page.locator('[role="alert"], [aria-invalid="true"]')).toBeVisible({ timeout: 5000 });
  });
});
