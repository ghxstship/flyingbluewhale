/**
 * Reports & Analytics engine clickthrough (kit v6.3) — the report library hub
 * plus every one of the 43 reports rendering live, and the metrics/reports API.
 * Each report must render the `.doc--report` artifact with KPI tiles (proving
 * ReportEngine + kit-reports.css + the metric resolvers resolve end-to-end).
 */
import { test, expect } from "./helpers/base";
import { authedSetup, dismissConsent, loginAs } from "./helpers/auth";
import { REPORTS_LIST } from "../src/lib/reports/registry";

test.describe("v6.3 reports — console", () => {
  test.beforeEach(async ({ page }) => {
    await authedSetup(page, "admin");
  });

  test("hub lists every report grouped by app", async ({ page }) => {
    await page.goto("/studio/reports");
    await expect(page.getByRole("heading", { name: "REPORT LIBRARY" })).toBeVisible();
    for (const r of REPORTS_LIST) {
      await expect(page.locator(`a[href="/studio/reports/${r.id}"]`)).toBeVisible();
    }
  });

  for (const r of REPORTS_LIST) {
    test(`renders ${r.id} (${r.kind})`, async ({ page }) => {
      await page.goto(`/studio/reports/${r.id}`);
      const doc = page.locator(`.doc--report[data-doc="report:${r.id}"]`);
      await expect(doc).toBeVisible();
      // at least one KPI tile + the print affordance
      await expect(doc.locator(".kpi").first()).toBeVisible();
      await expect(page.getByRole("button", { name: "Print / PDF" })).toBeVisible();
    });
  }

  test("unknown report id renders not-found (no report artifact)", async ({ page }) => {
    await page.goto("/studio/reports/not-a-real-report");
    await expect(page.getByText("Back to Workspace")).toBeVisible();
    await expect(page.locator(".doc--report")).toHaveCount(0);
  });

  test("white-label brand mode strips ATLVS attribution (parity with documents)", async ({ page }) => {
    await page.goto("/studio/reports/executive");
    const doc = page.locator('.doc--report[data-doc="report:executive"]');
    await expect(doc).toBeVisible();
    await page.getByRole("button", { name: "White-label" }).click();
    await expect(doc).toHaveAttribute("data-brand", "white");
    await page.getByRole("button", { name: "ATLVS", exact: true }).click();
    await expect(doc).toHaveAttribute("data-brand", "atlvs");
    // M10 — the co-brand variant (the third mode, previously untested).
    await page.getByRole("button", { name: "Co-brand" }).click();
    await expect(doc).toHaveAttribute("data-brand", "co");
  });
});

test.describe("v6.3 reports — API", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
  });

  test("GET /api/v1/metrics returns the 84-metric catalog", async ({ page }) => {
    const resp = await page.request.get("/api/v1/metrics");
    expect(resp.status()).toBe(200);
    const { data } = await resp.json();
    // 77 + the 7 kit-26 touring metrics (tours / day sheets).
    expect(data.metrics).toHaveLength(84);
    expect(data.metrics.every((m: { id: string; format: string }) => m.id && m.format)).toBe(true);
  });

  test("GET /api/v1/reports returns the 45-report library", async ({ page }) => {
    const resp = await page.request.get("/api/v1/reports");
    expect(resp.status()).toBe(200);
    const { data } = await resp.json();
    // 43 + the 2 kit-26 touring reports (Tour Status, Day Sheet Status).
    expect(data.reports).toHaveLength(45);
  });

  test("GET /api/v1/reports/{id} resolves metric values for the org", async ({ page }) => {
    const resp = await page.request.get("/api/v1/reports/executive");
    expect(resp.status()).toBe(200);
    const { data } = await resp.json();
    expect(data.report.id).toBe("executive");
    // every report metric has a resolved value key (number or null)
    for (const m of data.report.metrics) expect(data.metrics).toHaveProperty(m);
  });

  test("GET /api/v1/reports/{id}/snapshot stamps capturedAt", async ({ page }) => {
    const resp = await page.request.get("/api/v1/reports/executive/snapshot");
    expect(resp.status()).toBe(200);
    const { data } = await resp.json();
    expect(data.capturedAt).toBeTruthy();
    expect(data.report.id).toBe("executive");
  });

  test("unknown metric / report id 404s", async ({ page }) => {
    expect((await page.request.get("/api/v1/metrics/nope")).status()).toBe(404);
    expect((await page.request.get("/api/v1/reports/nope")).status()).toBe(404);
  });
});
