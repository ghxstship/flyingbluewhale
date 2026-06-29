import { chromium, type FullConfig } from "playwright/test";
import { TEST_PASSWORD, fixtureEmail, dismissConsent } from "./auth";

/**
 * Best-effort dev pre-warm. `next dev` cold-compiles each route on its first
 * hit (30–50s for heavy aggregation pages); paid inside a test's nav budget
 * that overruns and flakes. This compiles the shared shells + the handful of
 * known-heavy routes ONCE before the suite, so the first real test finds them
 * warm.
 *
 * Hard rule: this NEVER throws. Pre-warming is an optimization — if login or a
 * route hiccups here, we swallow it and let the (retry-enabled) tests run. It
 * only ever helps. Skipped entirely against a prod server (config gates it on
 * !E2E_PROD), where routes are already compiled.
 */

// The routes that actually cold-compile slowly enough to flake under a 30s
// budget (observed in full-suite runs). Warming these is the high-value move.
const HEAVY_AUTHED = [
  "/studio",
  "/studio/inspections",
  "/studio/safety/osha",
  "/studio/settings/integrations",
  "/studio/settings/integrations/marketplace",
  "/studio/settings/audit",
  "/studio/ai/automations",
  "/studio/finance/payroll",
  "/studio/documents",
  "/me",
  "/m",
];
const PUBLIC = ["/", "/login", "/pricing", "/docs", "/marketplace"];
const PORTAL_SLUG = "test-professional-show";
const PORTAL = [`/p/${PORTAL_SLUG}/overview`, `/p/${PORTAL_SLUG}/vendor`];

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:3000";
  const start = Date.now();
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ baseURL });
    const page = await ctx.newPage();
    page.setDefaultNavigationTimeout(70_000);

    const warm = async (path: string) => {
      try {
        await page.goto(path, { waitUntil: "domcontentloaded" });
      } catch {
        /* best-effort: ignore */
      }
    };

    // 1. Public shells (marketing + auth) — cheap, no session needed.
    for (const p of PUBLIC) await warm(p);

    // 2. Log in once, then warm the authed shells + heavy routes.
    try {
      await dismissConsent(page);
      await page.goto("/login");
      await page.getByRole("textbox", { name: "Email" }).fill(fixtureEmail("owner"));
      await page.getByRole("textbox", { name: "Password" }).fill(TEST_PASSWORD);
      await page.getByRole("button", { name: /^sign in$/i }).click();
      await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30_000 });
      for (const p of [...HEAVY_AUTHED, ...PORTAL]) await warm(p);
    } catch {
      /* login/pre-warm best-effort — tests do their own auth */
    }

    await ctx.close();
    console.log(`[global-setup] pre-warm done in ${Math.round((Date.now() - start) / 1000)}s`);
  } catch {
    /* never block the suite on pre-warm */
  } finally {
    await browser.close();
  }
}
