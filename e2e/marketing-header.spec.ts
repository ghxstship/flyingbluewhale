import { expect, test, type BrowserContext } from "playwright/test";

/**
 * Marketing-header M1 remediations:
 *   M1-01 — ThemeToggle label says "System" (not "Auto").
 *   M1-02 — MarketingHeader extracted (no behavior change; covered
 *           implicitly by every other spec that relies on the header).
 *   M1-03 — LocaleSwitcher writes a `locale` cookie + re-renders so
 *           `<html lang>` (and `dir` for RTL) reflect the choice.
 *   M1-04 — Themes button opens a sheet containing the 8-card
 *           AppearanceGallery; picking a card writes `chroma_theme`.
 *   M1-05 — Mobile viewport shows a hamburger; sheet contains nav
 *           links + theme toggle + locale switcher + themes trigger.
 */

async function dismissConsent(ctx: BrowserContext) {
  await ctx.addCookies([
    {
      name: "fbw_consent",
      value: encodeURIComponent(JSON.stringify({ essential: true, decidedAt: new Date().toISOString() })),
      domain: "localhost",
      path: "/",
    },
  ]);
}

test.describe("marketing-header/theme-toggle", () => {
  test("segmented control uses the System label (M1-01)", async ({ page, context }) => {
    await dismissConsent(context);
    await page.goto("/");
    // Radiogroup semantics, with three radio buttons — no literal "Auto".
    const group = page.getByRole("radiogroup", { name: /color theme/i });
    await expect(group).toBeVisible();
    await expect(group.getByRole("radio", { name: /use light/i })).toBeVisible();
    await expect(group.getByRole("radio", { name: /match system/i })).toBeVisible();
    await expect(group.getByRole("radio", { name: /use dark/i })).toBeVisible();
    // The visible label must literally say "System" — not "Auto".
    await expect(group).toContainText("System");
    await expect(group).not.toContainText(/^Auto$/);
  });

  test("clicking Dark flips checked state AND writes data-mode=dark on <html>", async ({ page, context }) => {
    await dismissConsent(context);
    await page.goto("/");

    // The CHROMA BEACON provider now owns both axes: `data-mode` carries
    // light/dark/system (resolved), `data-theme` carries the design slug.
    // The two no longer collide, so the mode toggle's effect is observable
    // on <html data-mode>.
    const darkRadio = page.getByRole("radio", { name: /use dark/i });
    await darkRadio.click();
    await expect(darkRadio).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");

    // Switching to Light flips both.
    await page.getByRole("radio", { name: /use light/i }).click();
    await expect(page.locator("html")).toHaveAttribute("data-mode", "light");
  });

  test("mode cookie (fbw_mode) persists the choice", async ({ page, context }) => {
    await dismissConsent(context);
    await page.goto("/");
    await page.getByRole("radio", { name: /use dark/i }).click();
    await expect.poll(async () => {
      const cookies = await context.cookies();
      return cookies.find((c) => c.name === "fbw_mode")?.value;
    }).toBe("dark");
  });
});

test.describe("marketing-header/locale-switcher (M1-03)", () => {
  test("switching to ja writes a cookie and updates <html lang>", async ({ page, context }) => {
    await dismissConsent(context);
    await page.goto("/");

    // Open dropdown
    await page.getByRole("button", { name: /change language/i }).click();
    // Select the Japanese option — locale name in native language, code suffix.
    await page.getByRole("menuitemradio", { name: /日本語/ }).click();

    // The refresh is a transition; wait for `<html lang="ja">`.
    await expect(page.locator("html")).toHaveAttribute("lang", "ja", { timeout: 5000 });

    // And the cookie round-trips on the next request.
    const cookies = await context.cookies();
    const localeCookie = cookies.find((c) => c.name === "locale");
    expect(localeCookie?.value).toBe("ja");
  });

  test("switching to ar flips <html dir> to rtl", async ({ page, context }) => {
    await dismissConsent(context);
    await page.goto("/");
    await page.getByRole("button", { name: /change language/i }).click();
    await page.getByRole("menuitemradio", { name: /العربية/ }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "ar", { timeout: 5000 });
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl", { timeout: 5000 });
  });
});

test.describe("marketing-header/theme-gallery (M1-04)", () => {
  test("Themes button opens the CHROMA BEACON sheet with the 8-card gallery", async ({ page, context }) => {
    await dismissConsent(context);
    await page.goto("/");

    await page.getByRole("button", { name: /open design-system theme picker/i }).click();

    // Sheet title renders
    await expect(page.getByRole("heading", { name: /pick a design theme/i })).toBeVisible();

    // Appearance heading + radiogroup — the AppearanceGallery labels its
    // radiogroup exactly "Theme" (singular).
    const gallery = page.getByRole("radiogroup", { name: "Theme" });
    await expect(gallery).toBeVisible();
    // 8 CHROMA BEACON themes — each card is a radio.
    const radios = gallery.getByRole("radio");
    await expect(radios).toHaveCount(8);
  });

  test("picking a theme in the sheet writes the chroma_theme cookie", async ({ page, context }) => {
    await dismissConsent(context);
    await page.goto("/");

    await page.getByRole("button", { name: /open design-system theme picker/i }).click();
    await page.getByRole("radio", { name: /brutal/i }).click();

    // Cookie is set by the ThemeProvider's setTheme() path.
    // Poll briefly — write happens after state update.
    await expect.poll(async () => {
      const cookies = await context.cookies();
      return cookies.find((c) => c.name === "chroma_theme")?.value;
    }).toBe("brutal");

    // And <html data-theme> reflects the new value.
    await expect(page.locator("html")).toHaveAttribute("data-theme", "brutal");
  });
});

test.describe("marketing-header/mobile-nav (M1-05)", () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 15 class

  test("hamburger replaces the desktop nav on narrow viewports", async ({ page, context }) => {
    await dismissConsent(context);
    await page.goto("/");

    // Desktop primary nav is hidden on mobile.
    const desktopNav = page.getByRole("navigation", { name: "Primary" });
    await expect(desktopNav).toBeHidden();

    // Hamburger trigger is visible + expands the sheet.
    const trigger = page.getByRole("button", { name: /open menu/i });
    await expect(trigger).toBeVisible();
    await trigger.click();

    // Mobile sheet nav exposes the same links as desktop primary nav.
    const mobileNav = page.getByRole("navigation", { name: /mobile primary/i });
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: /^solutions$/i })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: /^features$/i })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: /^pricing$/i })).toBeVisible();

    // Theme + language controls are also in the sheet (single source of truth).
    await expect(page.getByRole("radiogroup", { name: /color theme/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /change language/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /design themes/i })).toBeVisible();
  });

  test("close button restores the original state", async ({ page, context }) => {
    await dismissConsent(context);
    await page.goto("/");

    await page.getByRole("button", { name: /open menu/i }).click();
    await page.getByRole("button", { name: /close menu/i }).click();

    // Mobile sheet dismissed; hamburger is back.
    await expect(page.getByRole("navigation", { name: /mobile primary/i })).toBeHidden();
    await expect(page.getByRole("button", { name: /open menu/i })).toBeVisible();
  });
});
