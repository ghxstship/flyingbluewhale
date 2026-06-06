import { defineConfig, devices } from "playwright/test";

// Run against a PRODUCTION build (`next build && next start`) in CI or when
// E2E_PROD=1. A production server serves pre-compiled routes instantly, so the
// suite does not hit the Turbopack dev cold-compile load ceiling that wedges
// `next dev` under sustained traffic (~500+ routes / many chained creates).
// Locally (default) we keep `next dev` for a fast start + HMR.
const E2E_PROD = process.env.E2E_PROD === "1" || !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: E2E_PROD ? 45000 : 90000, // dev cold-compiles need more headroom
  use: {
    // localhost works because tests run with NEXT_PUBLIC_USE_SUBDOMAINS=0
    // (path-prefix mode — /console, /p, /m). For local dev with
    // SUBDOMAINS=1 (lvh.me), set baseURL to http://lvh.me:3000 instead.
    baseURL: "http://localhost:3000",
    navigationTimeout: 30000,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: E2E_PROD ? "npm run build && npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: E2E_PROD ? 600000 : 120000, // production build can take several minutes
  },
});
