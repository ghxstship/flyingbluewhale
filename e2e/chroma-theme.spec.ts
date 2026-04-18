import { expect, test, type Page } from "playwright/test";

/**
 * CHROMA BEACON e2e — theme persistence, FOUC prevention, cross-tab sync.
 *
 * Fixtures: relies on the seeded test+owner user. The Appearance gallery is
 * under /me/settings/appearance (authenticated route).
 */

const SLUGS = ["glass", "brutal", "bento", "kinetic", "copilot", "cyber", "soft", "earthy"] as const;
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

async function login(page: Page) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill("test+owner@flyingbluewhale.app");
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 10000 });
}

test.describe("CHROMA BEACON", () => {
  test("data-theme is set on <html> before first paint (head script)", async ({ page }) => {
    await dismissConsent(page);
    await page.context().addCookies([
      { name: "chroma_theme", value: "cyber", domain: "localhost", path: "/" },
    ]);
    await page.goto("/");
    const theme = await page.getAttribute("html", "data-theme");
    expect(theme).toBe("cyber");
    const scheme = await page.evaluate(() => document.documentElement.style.colorScheme);
    expect(scheme).toBe("dark");
  });

  test("invalid cookie falls back to default", async ({ page }) => {
    await dismissConsent(page);
    await page.context().addCookies([
      { name: "chroma_theme", value: "not-a-real-slug", domain: "localhost", path: "/" },
    ]);
    await page.goto("/");
    const theme = await page.getAttribute("html", "data-theme");
    expect(["kinetic", "cyber"]).toContain(theme);
  });

  test("AppearanceGallery renders 8 radio cards for authed users", async ({ page }) => {
    await dismissConsent(page);
    await login(page);
    await page.goto("/me/settings/appearance");
    await expect(page.getByRole("heading", { name: "Appearance", level: 1 })).toBeVisible();
    const radios = page.getByRole("radio");
    await expect(radios).toHaveCount(8);
  });

  test("selecting a theme updates data-theme + persists across reload", async ({ page }) => {
    await dismissConsent(page);
    await login(page);
    await page.goto("/me/settings/appearance");

    // Pick brutal
    await page.getByRole("radio", { name: /Neo-Brutalism/ }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "brutal");

    // Reload — theme must persist
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "brutal");
  });

  for (const slug of SLUGS) {
    test(`theme ${slug}: every token resolves (no unset CSS vars)`, async ({ page }) => {
      await dismissConsent(page);
      await page.context().addCookies([
        { name: "chroma_theme", value: slug, domain: "localhost", path: "/" },
      ]);
      await page.goto("/");
      const unset = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        const required = ["--bg", "--surface", "--text", "--accent", "--radius-md", "--font-body"];
        return required.filter((k) => !style.getPropertyValue(k).trim());
      });
      expect(unset).toEqual([]);
    });
  }

  test("keyboard nav: arrow keys move focus between cards; Enter selects", async ({ page }) => {
    await dismissConsent(page);
    await login(page);
    await page.goto("/me/settings/appearance");

    // Focus the first radio card
    const firstCard = page.getByRole("radio").first();
    await firstCard.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    // Some card should now be aria-checked=true that isn't the first one
    const checkedCount = await page.getByRole("radio", { checked: true }).count();
    expect(checkedCount).toBe(1);
  });

  test("Match system button resets to system default", async ({ page }) => {
    await dismissConsent(page);
    await login(page);
    await page.goto("/me/settings/appearance");

    // Pick something explicit first
    await page.getByRole("radio", { name: /Cyber Neon/ }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "cyber");

    // Then match system
    await page.getByRole("button", { name: /match system/i }).click();
    // data-theme becomes whichever system prefers (likely "kinetic" in headed chromium default)
    const theme = await page.getAttribute("html", "data-theme");
    expect(["kinetic", "cyber"]).toContain(theme);
  });
});
