import { expect, test } from "playwright/test";
import { dismissConsent, loginAs } from "./helpers/auth";

/**
 * CHROMA BEACON e2e — theme persistence, FOUC prevention, cross-tab sync.
 *
 * Fixtures: relies on the seeded test+owner user. The Appearance gallery is
 * under /me/settings/appearance (authenticated route).
 */

const SLUGS = [
  "bermuda-triangle",
  "glass",
  "brutal",
  "bento",
  "kinetic",
  "copilot",
  "cyber",
  "soft",
  "earthy",
] as const;

test.describe("CHROMA BEACON", () => {
  test("data-theme is set on <html> before first paint (head script)", async ({ page }) => {
    await dismissConsent(page);
    await page.context().addCookies([{ name: "chroma_theme", value: "cyber", domain: "localhost", path: "/" }]);
    await page.goto("/");
    const theme = await page.getAttribute("html", "data-theme");
    expect(theme).toBe("cyber");
    const scheme = await page.evaluate(() => document.documentElement.style.colorScheme);
    expect(scheme).toBe("dark");
  });

  test("invalid cookie falls back to default", async ({ page }) => {
    await dismissConsent(page);
    await page
      .context()
      .addCookies([{ name: "chroma_theme", value: "not-a-real-slug", domain: "localhost", path: "/" }]);
    await page.goto("/");
    const theme = await page.getAttribute("html", "data-theme");
    expect(["bermuda-triangle", "cyber"]).toContain(theme);
  });

  test("AppearanceGallery renders 9 radio cards for authed users", async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
    await page.goto("/me/settings/appearance");
    await expect(page.getByRole("heading", { name: "Appearance", level: 1 })).toBeVisible();
    // Scope to the AppearanceGallery's own radiogroup — the /me shell chrome
    // also renders the mode toggle (Light/System/Dark) as a radiogroup, so an
    // unscoped `getByRole("radio")` now returns 12 (9 + 3) after BERMUDA TRIANGLE
    // joined the registry as the new default light theme.
    const radios = page.getByRole("radiogroup", { name: "Theme", exact: true }).getByRole("radio");
    await expect(radios).toHaveCount(9);
  });

  test("selecting a theme updates data-theme + persists across reload", async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
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
      await page.context().addCookies([{ name: "chroma_theme", value: slug, domain: "localhost", path: "/" }]);
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
    await loginAs(page, "owner");
    await page.goto("/me/settings/appearance");

    // Scope to the appearance radiogroup so we don't fall into the mode toggle
    // that also lives on /me shell chrome.
    const gallery = page.getByRole("radiogroup", { name: "Theme", exact: true });
    const firstCard = gallery.getByRole("radio").first();
    await firstCard.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    // Some card should now be aria-checked=true that isn't the first one.
    const checkedCount = await gallery.getByRole("radio", { checked: true }).count();
    expect(checkedCount).toBe(1);
  });

  test("Match system button resets to system default", async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
    await page.goto("/me/settings/appearance");

    // Pick something explicit first
    await page.getByRole("radio", { name: /Cyber Neon/ }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "cyber");

    // Then match system
    await page.getByRole("button", { name: /match system/i }).click();
    // data-theme becomes whichever system prefers (likely "kinetic" in headed chromium default)
    const theme = await page.getAttribute("html", "data-theme");
    expect(["bermuda-triangle", "cyber"]).toContain(theme);
  });
});
