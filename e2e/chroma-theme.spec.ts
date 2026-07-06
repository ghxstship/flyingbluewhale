import { expect, test } from "playwright/test";
import { dismissConsent, loginAs } from "./helpers/auth";

/**
 * Theme system e2e — persistence, FOUC prevention, color-mode toggle.
 *
 * Theme canon: the v3 GHXSTSHIP brand sweep retired the pre-v3 CHROMA
 * exploration palettes, and the kit-wide migration (209245fd, 2026-06-07)
 * retired `ghxstship` as well. Exactly ONE slug survives in the registry
 * (src/app/theme/themes.config.ts#THEME_SLUGS): `atlvs-product` — the
 * neutral SaaS skin, light family, with dark via the orthogonal data-mode
 * axis and per-product accents via data-platform overlays. The Appearance
 * page exposes color-mode + density radiogroups only.
 *
 * Fixtures: relies on the seeded test+owner user. The Appearance settings
 * live under /me/settings/appearance (authenticated route).
 */

const SLUGS = ["atlvs-product"] as const;

test.describe("theme system", () => {
  test("data-theme is set on <html> before first paint (head script)", async ({ page }) => {
    await dismissConsent(page);
    await page.context().addCookies([{ name: "chroma_theme", value: "atlvs-product", url: process.env.E2E_BASE_URL || "http://localhost:3000" }]);
    await page.goto("/");
    const theme = await page.getAttribute("html", "data-theme");
    expect(theme).toBe("atlvs-product");
    const scheme = await page.evaluate(() => document.documentElement.style.colorScheme);
    expect(scheme).toBe("light");
  });

  test("no cookie resolves to the canonical default", async ({ page }) => {
    await dismissConsent(page);
    await page.goto("/");
    expect(await page.getAttribute("html", "data-theme")).toBe("atlvs-product");
  });

  test("invalid cookie falls back to default", async ({ page }) => {
    await dismissConsent(page);
    await page
      .context()
      .addCookies([{ name: "chroma_theme", value: "not-a-real-slug", url: process.env.E2E_BASE_URL || "http://localhost:3000" }]);
    await page.goto("/");
    const theme = await page.getAttribute("html", "data-theme");
    // Purged slugs (ghxstship, cyber, bermuda-triangle, …) must NOT resurface.
    expect(theme).toBe("atlvs-product");
  });

  test("Appearance page renders color-mode + density controls", async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
    await page.goto("/me/settings/appearance");
    await expect(page.getByRole("heading", { name: "Appearance", level: 1 })).toBeVisible();
    // The theme-picker gallery was retired with the single-skin canon; the
    // page exposes the orthogonal color-mode (Light / Match system / Dark)
    // and Density (Compact/Default/Spacious) radiogroups. ThemeToggle labels
    // its radiogroup "Color theme" (theme.toggle.colorTheme); DensityToggle "Density".
    const mode = page.getByRole("main").getByRole("radiogroup", { name: "Color theme", exact: true });
    await expect(mode.getByRole("radio")).toHaveCount(3);
    const density = page.getByRole("main").getByRole("radiogroup", { name: "Density", exact: true });
    await expect(density.getByRole("radio")).toHaveCount(3);
  });

  test("selecting a color mode updates data-mode + persists across reload", async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
    await page.goto("/me/settings/appearance");

    // Pick Dark explicitly — mode is applied as data-mode (orthogonal to the
    // data-theme palette slug).
    await page.getByRole("main").getByRole("radio", { name: "Dark", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");

    // Reload — mode must persist (cookie + localStorage).
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");
  });

  for (const slug of SLUGS) {
    test(`theme ${slug}: every token resolves (no unset CSS vars)`, async ({ page }) => {
      await dismissConsent(page);
      await page.context().addCookies([{ name: "chroma_theme", value: slug, url: process.env.E2E_BASE_URL || "http://localhost:3000" }]);
      await page.goto("/");
      const unset = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        // Kit tokens are the --p-* namespace; the legacy unprefixed names
        // (--bg/--surface/--text/--accent) only exist on the
        // :root:not([data-theme]) SSR bootstrap and are intentionally unset
        // once data-theme lands.
        const required = ["--p-bg", "--p-surface", "--p-text-1", "--p-accent", "--radius-md", "--font-body"];
        return required.filter((k) => !style.getPropertyValue(k).trim());
      });
      expect(unset).toEqual([]);
    });
  }

  test("GVTEWAY product overlay resolves the v5.1 blue accent (#2563eb, not cyan)", async ({ page }) => {
    await dismissConsent(page);
    await page.goto("/");
    // The per-product overlay is scoped to
    // [data-theme="atlvs-product"][data-platform="gvteway"]; activate it on
    // <html> (already data-theme="atlvs-product") and read the resolved token.
    //
    // v8.1: the accent is authored in OKLCH + light-dark(), so the computed
    // value is an oklch/lab color string, NOT a hex literal. Resolve it (and the
    // reference #2563eb) to sRGB via canvas and compare numerically — the OKLCH
    // GVTEWAY seed is the exact sRGB-equivalent of #2563eb (zero visual change).
    const { accent, target, retiredCyan } = await page.evaluate(() => {
      document.documentElement.setAttribute("data-platform", "gvteway");
      const probe = document.createElement("div");
      probe.style.color = "var(--p-accent)";
      document.documentElement.appendChild(probe);
      const accentColor = getComputedStyle(probe).color;
      probe.remove();
      const toRGB = (colorStr: string): [number, number, number] => {
        const c = document.createElement("canvas");
        c.width = c.height = 1;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = colorStr;
        ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return [d[0]!, d[1]!, d[2]!];
      };
      return { accent: toRGB(accentColor), target: toRGB("#2563eb"), retiredCyan: toRGB("#12b5b5") };
    });
    // Resolves to GVTEWAY blue (#2563eb) within a small rounding tolerance…
    const near = (a: number[], b: number[], tol = 6) => a.every((v, i) => Math.abs(v - b[i]!) <= tol);
    expect(near(accent, target), `accent rgb(${accent}) should match #2563eb rgb(${target})`).toBe(true);
    // …and is unmistakably blue (b channel dominant), not the retired cyan.
    expect(accent[2]).toBeGreaterThan(accent[0]); // blue > red
    expect(accent[2]).toBeGreaterThan(accent[1]); // blue > green
    expect(near(accent, retiredCyan), "must NOT be the retired cyan #12b5b5").toBe(false);
  });

  test("keyboard nav: arrow keys move focus between mode cards; Enter selects", async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
    await page.goto("/me/settings/appearance");

    const group = page.getByRole("main").getByRole("radiogroup", { name: "Color theme", exact: true });
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
    await page.getByRole("main").getByRole("radio", { name: "Dark", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");

    // The system preset's radio is labelled "Match system" (theme.toggle.system).
    await page.getByRole("main").getByRole("radio", { name: "Match system", exact: true }).click();
    const dataMode = await page.getAttribute("html", "data-mode");
    expect(["light", "dark"]).toContain(dataMode);
  });
});
