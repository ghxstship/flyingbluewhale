import { defineConfig, devices } from "playwright/test";

/**
 * Dedicated Playwright config for the CHROMA BEACON × responsive audit.
 * Separate from `playwright.config.ts` so CI can run the matrix on its
 * own schedule without slowing the default e2e gate.
 *
 *   npx playwright test --config=playwright.audit.config.ts
 *
 * Env:
 *   AUDIT_FULL=1          include every breakpoint (default: 3-of-6)
 *   AUDIT_BROWSERS=...    comma-sep browser filter (chromium,firefox,webkit)
 *   AUDIT_ROUTES=...      comma-sep routes to narrow the pass
 */

const requested = process.env.AUDIT_BROWSERS?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const allProjects = [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  { name: "webkit", use: { ...devices["Desktop Safari"] } },
];

export default defineConfig({
  testDir: "./e2e/audit",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "docs/audits/evidence/report.json" }]],
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
  },
  projects: requested ? allProjects.filter((p) => requested.includes(p.name)) : allProjects,
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
  },
});
