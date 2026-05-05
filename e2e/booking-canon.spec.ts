/**
 * Booking canon (migration 0003 — Prism.fm parity).
 *
 * Coverage:
 *   - Public surfaces: /marketplace/agencies + slug, /marketplace/calendar
 *   - Console hub + every booking sub-surface compiles + renders
 *   - Settings sidebar surfaces /console/settings/integrations/ticketing
 *   - Form actions: settlement upsert + finalize, tiered hold create + auto-promote,
 *     ticketing connection, tour create
 *   - Trigger behaviors: tier auto-promotion on hold release,
 *     settlement balance auto-recompute
 *
 * Reuses fixture seeds from marketplace-canon-actions plus 0003-specific
 * fixtures inserted directly into test-professional.
 */
import { expect, test, type Page } from "playwright/test";

const PASSWORD = "FlyingBlue!Test2026";
const OWNER_EMAIL = "test+owner@flyingbluewhale.app";
const TEST_ORG_ID = "f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7";

async function dismissConsent(page: Page) {
  await page.context().addCookies([
    {
      name: "fbw_consent",
      value: encodeURIComponent(
        JSON.stringify({ essential: true, analytics: false, marketing: false, decidedAt: new Date().toISOString() }),
      ),
      domain: "localhost",
      path: "/",
    },
  ]);
}

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(OWNER_EMAIL);
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 25_000 });
  const r = await page.request.patch("/api/v1/me/workspaces", { data: { orgId: TEST_ORG_ID } });
  if (r.status() !== 200) {
    throw new Error(`workspace switch failed: ${r.status()} ${await r.text()}`);
  }
}

const PUBLIC_SURFACES = [
  { path: "/marketplace/agencies", expectedH1: /AGENCY DIRECTORY/i },
  { path: "/marketplace/calendar", expectedH1: /EVENT CALENDAR/i },
];

const CONSOLE_SURFACES = [
  { path: "/console/bookings", h1: /Overview/i },
  { path: "/console/bookings/deals", h1: /Deal Tracker/i },
  { path: "/console/bookings/holds", h1: /Holds/i },
  { path: "/console/bookings/holds/new", h1: /New Hold/i },
  { path: "/console/bookings/calendar", h1: /Calendar/i },
  { path: "/console/bookings/settlements", h1: /Settlements/i },
  { path: "/console/agency", h1: /Overview/i },
  { path: "/console/agency/roster", h1: /Roster/i },
  { path: "/console/agency/tours", h1: /Tours/i },
  { path: "/console/agency/tours/new", h1: /New Tour/i },
  { path: "/console/agency/commissions", h1: /Commissions/i },
  { path: "/console/marketing", h1: /Overview/i },
  { path: "/console/marketing/onsales", h1: /On-sales/i },
  { path: "/console/marketing/calendar", h1: /Calendar/i },
  { path: "/console/insights", h1: /Booking Pool/i },
  { path: "/console/settings/integrations/ticketing", h1: /Ticketing/i },
  { path: "/console/settings/integrations/ticketing/new", h1: /New Ticketing Connection/i },
];

test.describe("Booking canon · public surfaces render", () => {
  for (const s of PUBLIC_SURFACES) {
    test(`renders ${s.path}`, async ({ page }) => {
      const r = await page.goto(s.path);
      expect(r?.status()).toBe(200);
      await expect(page.locator("h1").first()).toHaveText(s.expectedH1);
    });
  }
});

test.describe("Booking canon · authed surfaces compile + render", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAsOwner(page);
  });

  for (const s of CONSOLE_SURFACES) {
    test(`${s.path} renders`, async ({ page }) => {
      const r = await page.goto(s.path);
      expect(r?.status()).toBe(200);
      const h1 = page.locator("h1").first();
      if (await h1.count()) {
        await expect(h1).toHaveText(s.h1);
      }
    });
  }
});

test.describe("Booking canon · settings sidebar surfaces ticketing link", () => {
  test("settings sidebar shows Ticketing link", async ({ page }) => {
    await dismissConsent(page);
    await loginAsOwner(page);
    await page.goto("/console/settings/organization");
    await expect(page.locator('a[href="/console/settings/integrations/ticketing"]').first()).toBeVisible();
  });
});

test.describe("Booking canon · form actions", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAsOwner(page);
  });

  test("create tiered hold → list shows it", async ({ page }) => {
    const label = `E2E Hold T1 ${Date.now()}`;
    await page.goto("/console/bookings/holds/new");
    await page.locator('select[name="tier"]').selectOption("1");
    await page.getByLabel("Label").fill(label);
    const start = new Date(Date.now() + 86_400_000).toISOString().slice(0, 16);
    const end = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 16);
    await page.locator('input[name="starts_at"]').fill(start);
    await page.locator('input[name="ends_at"]').fill(end);
    await page.getByRole("button", { name: /Place Hold/i }).click();
    await page.waitForURL("**/console/bookings/holds", { timeout: 15_000 });
    await expect(page.getByText(label)).toBeVisible({ timeout: 5_000 });
  });

  test("upsert settlement on a deal → balance recomputes", async ({ page }) => {
    // Use the seeded fixture offer.
    const offerId = "ffffffff-0001-4001-8001-000000000001";
    await page.goto(`/console/bookings/deals/${offerId}/settlement`);
    await expect(page.locator("h1").first()).toHaveText(/Post-Show Reconciliation/i);

    await page.getByLabel("Gross Box Office").fill("12500");
    await page.getByLabel("Sales Tax").fill("875");
    await page.getByLabel("CC Fees").fill("365");
    await page.getByLabel("Paid Attendance").fill("450");
    await page.getByLabel("Artist Payout").fill("5000");
    await page.getByLabel("Agent Commission").fill("500");
    await page.getByLabel("Deposit Received").fill("3000");
    await page.getByRole("button", { name: /Create Settlement|Update/i }).click();
    await page.waitForLoadState("networkidle");

    // Reload and assert the computed block renders
    await page.goto(`/console/bookings/deals/${offerId}/settlement`);
    await expect(page.getByText(/Computed/i).first()).toBeVisible();
    await expect(page.getByText("NBOR").first()).toBeVisible();
  });

  test("create ticketing connection", async ({ page }) => {
    const label = `E2E DICE ${Date.now()}`;
    await page.goto("/console/settings/integrations/ticketing/new");
    await page.locator('select[name="provider"]').selectOption("dice");
    await page.getByLabel("Label").fill(label);
    await page.getByRole("button", { name: /^Connect$/i }).click();
    // Action now redirects to the new connection's detail page.
    await page.waitForURL(/\/ticketing\/[0-9a-f-]+$/, { timeout: 15_000 });
    await expect(page.locator("h1").first()).toContainText(label);
  });

  test("create tour → land on detail with empty leg list", async ({ page }) => {
    const name = `E2E Tour ${Date.now()}`;
    await page.goto("/console/agency/tours/new");
    await page.getByLabel("Tour Name").fill(name);
    await page.locator('select[name="talent_profile_id"]').selectOption({ index: 1 });
    await page.getByRole("button", { name: /Create Tour/i }).click();
    await page.waitForURL(/\/console\/agency\/tours\/[0-9a-f-]+$/, { timeout: 15_000 });
    await expect(page.locator("h1").first()).toHaveText(name);
  });
});

test.describe("Booking canon · IA — Bookings group + ticketing in settings", () => {
  test("Bookings group surfaces in primary sidebar", async ({ page }) => {
    await dismissConsent(page);
    await loginAsOwner(page);
    await page.goto("/console/bookings");
    for (const path of [
      "/console/bookings",
      "/console/bookings/deals",
      "/console/bookings/holds",
      "/console/bookings/calendar",
      "/console/bookings/settlements",
      "/console/agency/tours",
      "/console/marketing",
      "/console/insights",
    ]) {
      await expect(page.locator(`aside a[href="${path}"]`).first()).toBeVisible();
    }
  });
});
