import { expect, test } from "playwright/test";
import { dismissConsent, loginAs } from "./helpers/auth";

/**
 * CHROMA BEACON e2e — theme persistence, FOUC prevention, color-mode toggle.
 *
 * Fixtures: relies on the seeded test+owner user. The Appearance settings
 * live under /me/settings/appearance (authenticated route).
 *
 * Theme canon: the v3 GHXSTSHIP brand sweep retired the pre-v3 CHROMA
 * exploration palettes (bermuda-triangle, glass, brutal, bento, kinetic,
 * copilot, cyber, soft, earthy). Exactly two slugs survive in the registry
 * (src/app/theme/themes.config.ts#THEME_SLUGS): `ghxstship` (cosmic, dark
 * family, marketing) and `atlvs-product` (neutral SaaS, light family). The
 * Appearance page no longer renders a theme-picker gallery — it exposes the
 * orthogonal color-mode + density radiogroups only.
 */

const SLUGS = ["ghxstship", "atlvs-product"] as const;

test.describe("CHROMA BEACON", () => {
  test("data-theme is set on <html> before first paint (head script)", async ({ page }) => {
    await dismissConsent(page);
    // atlvs-product is a valid, non-default, light-family slug — proves the
    // head bootstrap honors the canonical registry set and color-scheme
    // follows the theme family.
    await page.context().addCookies([{ name: "chroma_theme", value: "atlvs-product", domain: "localhost", path: "/" }]);
    await page.goto("/");
    const theme = await page.getAttribute("html", "data-theme");
    expect(theme).toBe("atlvs-product");
    const scheme = await page.evaluate(() => document.documentElement.style.colorScheme);
    expect(scheme).toBe("light");
  });

  test("ghxstship default carries dark color-scheme", async ({ page }) => {
    await dismissConsent(page);
    await page.context().addCookies([{ name: "chroma_theme", value: "ghxstship", domain: "localhost", path: "/" }]);
    await page.goto("/");
    expect(await page.getAttribute("html", "data-theme")).toBe("ghxstship");
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
    // Default after the rebrand is ghxstship; a purged slug like cyber must
    // NOT resurface.
    expect(theme).toBe("ghxstship");
  });

  test("Appearance page renders color-mode + density controls", async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
    await page.goto("/me/settings/appearance");
    await expect(page.getByRole("heading", { name: "Appearance", level: 1 })).toBeVisible();
    // The theme-picker gallery was retired with the two-skin canon; the page
    // now exposes the orthogonal color-mode (Light / Match system / Dark) and
    // Density (Compact/Default/Spacious) radiogroups. ThemeToggle labels its
    // radiogroup "Color theme" (theme.toggle.colorTheme); DensityToggle "Density".
    const mode = page.getByRole("radiogroup", { name: "Color theme", exact: true });
    await expect(mode.getByRole("radio")).toHaveCount(3);
    const density = page.getByRole("radiogroup", { name: "Density", exact: true });
    await expect(density.getByRole("radio")).toHaveCount(3);
  });

  test("selecting a color mode updates data-mode + persists across reload", async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
    await page.goto("/me/settings/appearance");

    // Pick Dark explicitly — mode is applied as data-mode (orthogonal to the
    // data-theme palette slug).
    await page.getByRole("radio", { name: "Dark", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");

    // Reload — mode must persist (cookie + localStorage).
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");
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

  test("keyboard nav: arrow keys move focus between mode cards; Enter selects", async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
    await page.goto("/me/settings/appearance");

    const group = page.getByRole("radiogroup", { name: "Color theme", exact: true });
    const firstCard = group.getByRole("radio").first();
    await firstCard.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    // Exactly one radio should be checked after selection.
    const checkedCount = await group.getByRole("radio", { checked: true }).count();
    expect(checkedCount).toBe(1);
  });

  test("Match system resets color mode to system default", async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
    await page.goto("/me/settings/appearance");

    // Pick Dark first, then Match system — data-mode resolves to whatever the
    // OS prefers (light or dark), so just assert it's one of the two.
    await page.getByRole("radio", { name: "Dark", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");

    // The system preset's radio is labelled "Match system" (theme.toggle.system).
    await page.getByRole("radio", { name: "Match system", exact: true }).click();
    const dataMode = await page.getAttribute("html", "data-mode");
    expect(["light", "dark"]).toContain(dataMode);
  });
});
