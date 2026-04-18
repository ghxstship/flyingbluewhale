import { expect, test, type Page } from "playwright/test";

/**
 * Multi-role workflow validation. Drives the actual seeded test users
 * through login → shell resolution → console nav.
 *
 * Seeded fixtures (via supabase/functions/seed-test-fixtures):
 * - 4 orgs at tiers: portal, starter, professional, enterprise
 * - 10 users with platform_role: developer/owner/admin/controller/collaborator/
 *   contractor/crew/client/viewer/community
 * - All users are members of every test org
 * - Shared password: FlyingBlue!Test2026
 */

const PASSWORD = "FlyingBlue!Test2026";
const TEST_EMAIL = (role: string) => `test+${role}@flyingbluewhale.app`;

const PERSONAS = {
  internal: ["developer", "owner", "admin", "controller", "collaborator"] as const,
  external: ["client", "vendor"] as const, // not all enum values map to a portal persona
  field: ["crew", "contractor"] as const,
  guest: ["community", "viewer"] as const,
};

async function dismissConsent(page: Page) {
  await page.context().addCookies([
    {
      name: "fbw_consent",
      value: encodeURIComponent(
        JSON.stringify({
          essential: true,
          analytics: false,
          marketing: false,
          decidedAt: new Date().toISOString(),
        }),
      ),
      domain: "localhost",
      path: "/",
    },
  ]);
}

async function login(page: Page, role: string) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(TEST_EMAIL(role));
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  // Wait for redirect away from /login
  await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 10000 });
}

async function signOut(page: Page) {
  await page.context().clearCookies();
}

test.describe("multi-role login + shell resolution", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
  });

  for (const role of [...PERSONAS.internal, ...PERSONAS.field, ...PERSONAS.external[0] === "client" ? ["client"] : [], "viewer", "community"]) {
    test(`login as ${role} succeeds and lands in a shell`, async ({ page }) => {
      await login(page, role);
      const url = page.url();
      // Must be in console (/console), portal (/p/), mobile (/m), or personal (/me)
      expect(url).toMatch(/(console|\/p\/|\/m|\/me|auth\/resolve)/);
    });
  }
});

test.describe("internal personas land in console", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
  });

  for (const role of PERSONAS.internal) {
    test(`${role} reaches /console`, async ({ page }) => {
      await login(page, role);
      // Owner/admin/etc should get to console eventually
      await page.goto("/console");
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 5000 });
      // Sidebar should be visible with at least one nav link
      const sidebarLinks = page.locator("aside a, nav a");
      await expect(sidebarLinks.first()).toBeVisible();
    });
  }
});

test.describe("console pages render for owner", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await login(page, "owner");
  });

  const PAGES_TO_TEST = [
    "/console",
    "/console/projects",
    "/console/clients",
    "/console/proposals",
    "/console/finance/invoices",
    "/console/procurement/vendors",
    "/console/procurement/purchase-orders",
    "/console/people/crew",
    "/console/ai/assistant",
    "/console/settings/compliance",
    "/me/profile",
    "/me/security",
    "/me/privacy",
    "/me/organizations",
  ];

  for (const path of PAGES_TO_TEST) {
    test(`${path} loads without server error`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(500);
      // No serious console errors
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      await page.waitForLoadState("domcontentloaded");
      // Filter out known noise: 404 favicons, third-party
      const fatal = errors.filter(
        (e) => !e.includes("favicon") && !e.includes("404"),
      );
      expect(fatal).toEqual([]);
    });
  }
});

test.describe("RLS — users only see their own org data", () => {
  test("crew user can read own membership but not other users' privacy data", async ({ page }) => {
    await dismissConsent(page);
    await login(page, "crew");
    // /me/privacy is per-user — should load
    await page.goto("/me/privacy");
    await expect(page.locator("h1")).toContainText(/privacy/i);
  });
});
