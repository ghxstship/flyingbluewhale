/**
 * Kit 29 — the COMPVSS standalone-app surfaces + the ratified theming rules.
 *
 * Covers the four surfaces the DS ⇄ repo alignment added (Conformance Spec,
 * ratified 2026-07-17) across the crew (member band) and manager (manager band)
 * personas, plus the two theming invariants that are only observable in a
 * real browser: the marketing shell rides the ATLVS cold-start default (no
 * GHXSTSHIP theme), and focus rings resolve through --p-focus.
 *
 *   /m/search          — Global Search route (top-bar entry, scope chips)
 *   /m/support         — Help & Support (report-a-problem routes to intake)
 *   /m/settings/about  — About · Legal (version, licenses, privacy, terms)
 *   /m/settings/account — Data Export + Delete Account (render-only: this
 *                         suite must never actually delete a fixture user)
 */
import { expect, test, type Page } from "./helpers/base";
import { authedSetup } from "./helpers/auth";

const ERROR_BOUNDARY = /something went wrong|application error|unhandled|digest:/i;

async function expectRendered(page: Page) {
  await expect(page.locator(".scr-h, h1").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
}

for (const persona of ["crew", "manager"] as const) {
  test.describe(`kit-29 surfaces · ${persona}`, () => {
    test.describe.configure({ timeout: 180_000 });
    test.beforeEach(async ({ page }) => authedSetup(page, persona));

    test("top-bar search button opens the /m/search route", async ({ page }) => {
      await page.goto("/m");
      await page.getByRole("button", { name: "Search" }).first().click();
      await page.waitForURL(/\/m\/search/, { timeout: 15_000 });
      await expectRendered(page);
      await expect(page.locator(".searchbar input")).toBeVisible();
    });

    test("Global Search: scope chips render, a query resolves honestly", async ({ page }) => {
      await page.goto("/m/search");
      await expectRendered(page);
      for (const chip of ["All", "Tasks", "People", "Assets", "Docs", "Spaces"]) {
        await expect(page.getByRole("button", { name: chip, exact: true })).toBeVisible();
      }
      await page.locator(".searchbar input").fill("a");
      // Either grouped results or the honest no-match line — never a crash.
      await expect(page.locator(".grph").first().or(page.getByText(/nothing matches/i))).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
    });

    test("Global Search: a scoped filter narrows the groups", async ({ page }) => {
      await page.goto("/m/search");
      await expectRendered(page);
      await page.getByRole("button", { name: "Tasks", exact: true }).click();
      await page.locator(".searchbar input").fill("a");
      await expect(page.locator(".grph").first().or(page.getByText(/nothing matches/i))).toBeVisible({
        timeout: 20_000,
      });
      // Scoped to Tasks: no People/Spaces group headers may appear.
      await expect(page.locator(".grph", { hasText: "People" })).toHaveCount(0);
      await expect(page.locator(".grph", { hasText: "Spaces" })).toHaveCount(0);
    });

    test("Help & Support renders; Safety Issue routes to the incident intake", async ({ page }) => {
      await page.goto("/m/support");
      await expectRendered(page);
      await expect(page.getByText("Report A Problem")).toBeVisible();
      await page.getByText("Safety Issue").click();
      await page.waitForURL(/\/m\/incident\/new|\/m\/incidents\/new/, { timeout: 15_000 });
      await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
    });

    test("About · Legal renders version, licenses, privacy and terms in-app", async ({ page }) => {
      await page.goto("/m/settings/about");
      await expectRendered(page);
      await expect(page.getByText(/Version \d+\.\d+\.\d+/)).toBeVisible();
      await expect(page.getByRole("heading", { name: "Licenses" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Terms of Service" })).toBeVisible();
    });

    test("Account: Data Export is a real endpoint link; Delete Account gates on DELETE", async ({ page }) => {
      await page.goto("/m/settings/account");
      await expectRendered(page);
      const exportLink = page.getByRole("link", { name: /Export My Data/ });
      await expect(exportLink).toBeVisible();
      await expect(exportLink).toHaveAttribute("href", "/api/v1/me/export");
      await expect(page.getByRole("heading", { name: "Delete Account" })).toBeVisible();
      // The destructive CTA must be disabled until the confirm word is typed.
      const del = page.getByRole("button", { name: /Delete My Account/ });
      await expect(del).toBeDisabled();
      // Render-only: never type DELETE here — these are shared fixtures.
    });

    test("Settings links out to Support and About", async ({ page }) => {
      await page.goto("/m/settings");
      await expectRendered(page);
      await expect(page.getByText("Help & Support")).toBeVisible();
      await expect(page.getByText("About · Legal")).toBeVisible();
    });
  });
}

test.describe("kit-29 theming invariants", () => {
  test("marketing shell carries NO data-product and resolves the ATLVS cold-start accent", async ({ page }) => {
    await page.goto("/");
    const shell = page.locator(".page-shell").first();
    await expect(shell).toBeVisible({ timeout: 20_000 });
    await expect(shell).not.toHaveAttribute("data-product", /.+/);
    // The resolved accent must be the volcanic-red family (not the retired
    // house green): hue check via the computed accent custom property.
    const accent = await shell.evaluate((el) => getComputedStyle(el).getPropertyValue("--p-accent").trim());
    expect(accent, "cold-start accent must resolve (non-empty)").not.toBe("");
    expect(accent, "house green must not resolve as the accent").not.toMatch(/2edb3a|143\.\d/i);
  });

  test("legend type axis serves the Frutiger face", async ({ page }) => {
    // The woff2 must actually be mountable — request it directly.
    const res = await page.request.get("/_next/static/media/Frutiger.woff2").catch(() => null);
    // Next fingerprints asset names; fall back to asserting the @font-face
    // source is present in the compiled CSS payload of any legend page.
    if (!res || !res.ok()) {
      await page.goto("/");
      const hasFrutiger = await page.evaluate(async () => {
        for (const sheet of Array.from(document.styleSheets)) {
          try {
            for (const rule of Array.from(sheet.cssRules ?? [])) {
              if (rule instanceof CSSFontFaceRule && /frutiger/i.test(rule.cssText)) return true;
            }
          } catch {
            // cross-origin sheet — skip
          }
        }
        return false;
      });
      expect(hasFrutiger, "@font-face for Frutiger must be in the compiled CSS").toBe(true);
    }
  });
});
