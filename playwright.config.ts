import { defineConfig, devices } from "playwright/test";

// Run against a PRODUCTION build (`next build && next start`) in CI or when
// E2E_PROD=1. A production server serves pre-compiled routes instantly, so the
// suite does not hit the Turbopack dev cold-compile load ceiling that wedges
// `next dev` under sustained traffic (~500+ routes / many chained creates).
// Locally (default) we keep `next dev` for a fast start + HMR.
const E2E_PROD = process.env.E2E_PROD === "1" || !!process.env.CI;
// E2E_BASE_URL points the suite at an ALREADY-DEPLOYED target (e.g. a Vercel
// preview or https://atlvs.pro) — no local server is started. The apex serves
// the path-prefix routes single-host (/studio, /p, /m, /events) and the session
// cookie is scoped to .atlvs.pro (shared across subdomains), so the existing
// path-based specs run unchanged. Use it to escape the local `next dev`
// cold-compile ceiling: `E2E_BASE_URL=https://atlvs.pro npx playwright test`.
const E2E_BASE_URL = process.env.E2E_BASE_URL;
// REMOTE = a pre-compiled server (prod build OR a deployed URL): no dev
// cold-compile, so use the tighter timeouts + skip the local pre-warm.
const REMOTE = E2E_PROD || !!E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  // The visual-regression audit (e2e/audit/**) has its own dedicated config
  // (playwright.audit.config.ts) with config-specific snapshot baselines and a
  // multi-browser matrix. Running those PNG-diff specs under the functional
  // config double-counts them and compares against baselines captured by the
  // other config — keep the functional suite functional.
  testIgnore: /\/audit\//,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // One retry locally too: a `next dev` cold-compile that overruns the nav
  // budget on its first hit self-heals on retry (the route is warm by then).
  // The happy path is unaffected — retries only re-run failures.
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  // Pre-warm the shared shells (marketing/auth + the authed app layouts) once
  // before the suite so the first real test doesn't pay the cold-compile tax
  // inside its own timeout budget. Skipped against a prod server (already
  // compiled). See e2e/helpers/global-setup.ts.
  globalSetup: REMOTE ? undefined : "./e2e/helpers/global-setup.ts",
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: REMOTE ? 45000 : 90000, // dev cold-compiles need more headroom
  use: {
    // localhost works because tests run with NEXT_PUBLIC_USE_SUBDOMAINS=0
    // (path-prefix mode — /console, /p, /m). For local dev with
    // SUBDOMAINS=1 (lvh.me), set baseURL to http://lvh.me:3000 instead.
    baseURL: E2E_BASE_URL || "http://localhost:3000",
    // `next dev` cold-compiles heavy aggregation pages (inspections, OSHA,
    // integrations, AI, portal personas) in 30–50s on first hit. Give dev a
    // 60s nav budget (matches the sitemap-crawl harness); a prod server serves
    // pre-compiled routes instantly, so 30s is plenty there.
    navigationTimeout: REMOTE ? 30000 : 60000,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: E2E_BASE_URL ? undefined : {
    command: E2E_PROD ? "npm run build && npm run start" : "npm run dev",
    // Readiness probe hits the fast liveness endpoint, NOT `/` — the marketing
    // home cold-compiles for minutes on a fresh dev server (heavy client libs),
    // which blew the old 120s budget before any test ran. Liveness compiles in
    // ~1s, so the server is "ready" quickly; individual routes then cold-compile
    // within each test's own timeout.
    url: E2E_PROD ? "http://localhost:3000" : "http://localhost:3000/api/v1/health/liveness",
    reuseExistingServer: !process.env.CI,
    timeout: E2E_PROD ? 600000 : 240000, // dev cold-start headroom
  },
});
