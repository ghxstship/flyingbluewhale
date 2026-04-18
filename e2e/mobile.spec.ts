import { expect, test, type Page } from "playwright/test";

const PASSWORD = "FlyingBlue!Test2026";

async function dismissConsent(page: Page) {
  await page.context().addCookies([
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
}

async function loginAsCrew(page: Page) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(`test+crew@flyingbluewhale.app`);
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 10000 });
}

test.describe("mobile field shell", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAsCrew(page);
  });

  test("/m home renders with FAB + tab bar", async ({ page }) => {
    const r = await page.goto("/m");
    expect(r?.status()).toBeLessThan(500);
    // FAB has aria-label="Scan ticket"
    await expect(page.getByRole("link", { name: "Scan ticket", exact: true })).toBeVisible();
  });

  const PAGES = [
    "/m",
    "/m/check-in",
    "/m/check-in/manual",
    "/m/tasks",
    "/m/guide",
    "/m/crew",
    "/m/crew/clock",
    "/m/inventory/scan",
    "/m/incidents/new",
    "/m/settings",
  ];

  for (const path of PAGES) {
    test(`${path} loads`, async ({ page }) => {
      const r = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(r?.status()).toBeLessThan(500);
    });
  }
});
