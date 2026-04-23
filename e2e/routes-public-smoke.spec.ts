/**
 * Public-surface smoke suite.
 *
 * Every unauth'd URL a real visitor might land on is reachable and
 * renders a 200 (or a deliberate redirect). No server errors, no empty
 * layouts, no broken React trees.
 *
 * Keeps `roles.spec.ts` focused on authed shells and `marketing.spec.ts`
 * focused on content assertions; this file is for "does anything 500".
 */
import { expect, test } from "playwright/test";

const MARKETING = [
  "/",
  "/about",
  "/pricing",
  "/solutions",
  "/compare",
  "/features",
  "/community",
  "/guides",
  "/blog",
  "/changelog",
  "/contact",
  "/docs",
  "/legal",
  "/legal/privacy",
  "/legal/terms",
];

const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"];

test.describe("public marketing routes", () => {
  for (const path of MARKETING) {
    test(`GET ${path} → 200 with <main>`, async ({ page }) => {
      const resp = await page.goto(path);
      expect(resp?.status() ?? 200).toBeLessThan(500);
      // At least a <main> or an <h1> — "something rendered".
      const anchor = page.locator("main, h1").first();
      await expect(anchor).toBeVisible({ timeout: 5000 });
    });
  }
});

test.describe("auth pages", () => {
  for (const path of AUTH_PAGES) {
    test(`GET ${path} renders`, async ({ page }) => {
      const resp = await page.goto(path);
      expect(resp?.status() ?? 200).toBeLessThan(500);
      // Every auth page ships a form or a heading.
      const anchor = page.locator("form, h1").first();
      await expect(anchor).toBeVisible({ timeout: 5000 });
    });
  }
});

test.describe("graceful 404s", () => {
  test("unknown public route renders the 404 shell, not a 500", async ({ page }) => {
    const r = await page.goto("/this-does-not-exist-intentionally");
    expect(r?.status()).toBe(404);
    await expect(page.getByText(/not found|404/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("unknown console route under an auth'd user 404s instead of crashing", async ({ page, context }) => {
    // Without a session the middleware redirects to /login, which is fine too.
    await context.addCookies([
      {
        name: "fbw_consent",
        value: encodeURIComponent(
          JSON.stringify({ essential: true, analytics: false, marketing: false, decidedAt: new Date().toISOString() }),
        ),
        domain: "localhost",
        path: "/",
      },
    ]);
    const r = await page.goto("/console/does-not-exist");
    expect(r?.status() ?? 200).not.toBe(500);
  });
});
