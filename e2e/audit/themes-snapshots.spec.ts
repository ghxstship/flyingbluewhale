/**
 * Visual regression snapshots (audit m4).
 *
 * Narrow scope — Chromium only, 4 flagship routes × 3 themes × 2
 * breakpoints = 24 baselines. A full cross-browser/theme baseline tree
 * would add ~1,500 PNGs to the repo; Playwright's `toHaveScreenshot()`
 * tolerates pixel diffs so we only need coverage on the high-signal
 * combos. The full PNG-per-cell artifact trail still lives in
 * `docs/audits/evidence/` via the main matrix spec.
 *
 * Update baselines with:
 *   npx playwright test --config=playwright.audit.config.ts \
 *     e2e/audit/themes-snapshots.spec.ts --update-snapshots
 */
import { expect, test, type Page } from "playwright/test";

const SNAPSHOT_THEMES = ["kinetic", "cyber", "earthy"] as const;
const SNAPSHOT_BREAKPOINTS = [
  { name: "mobile-s", width: 375, height: 667 },
  { name: "desktop", width: 1280, height: 800 },
];
const SNAPSHOT_ROUTES = [
  { path: "/", name: "marketing-home" },
  { path: "/pricing", name: "marketing-pricing" },
  { path: "/login", name: "auth-login" },
  { path: "/solutions", name: "marketing-solutions" },
];

async function setTheme(page: Page, theme: string) {
  await page.context().addCookies([
    { name: "fbw_consent", value: encodeURIComponent('{"essential":true,"analytics":false,"marketing":false,"decidedAt":"2026-04-20T00:00:00Z"}'), domain: "localhost", path: "/" },
    { name: "chroma_theme", value: theme, domain: "localhost", path: "/" },
  ]);
}

for (const route of SNAPSHOT_ROUTES) {
  for (const theme of SNAPSHOT_THEMES) {
    for (const bp of SNAPSHOT_BREAKPOINTS) {
      test(`snapshot · ${route.name} · ${theme} · ${bp.name}`, async ({ page, browserName }) => {
        test.skip(browserName !== "chromium", "Snapshots only run on chromium to keep the baseline set small.");
        await page.setViewportSize({ width: bp.width, height: bp.height });
        await setTheme(page, theme);
        await page.goto(route.path, { waitUntil: "domcontentloaded" });
        // Give fonts a beat to settle so the baseline isn't font-loading-dependent.
        await page.evaluate(async () => {
          if ("fonts" in document) await (document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready;
        });
        await expect(page).toHaveScreenshot(`${route.name}--${theme}--${bp.name}.png`, {
          fullPage: false,
          maxDiffPixelRatio: 0.02, // 2% — generous enough to survive font subpixel drift
          animations: "disabled",
        });
      });
    }
  }
}
