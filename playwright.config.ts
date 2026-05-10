import { defineConfig, devices } from "playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 45000,
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
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
