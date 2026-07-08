/**
 * Deployment-readiness gap specs (reports/DEPLOYMENT_READINESS_2026-06-09.md).
 *
 * Covers Coverage-Matrix cells the legacy suite misses:
 *  - P1-A remediation: admin-only settings views deny non-admins gracefully
 *    (was: nav-hiding only).
 *  - F2 denial verification for member/client principals on operator surfaces.
 *  - F4 unauthenticated deep link → /login?next= → original destination.
 *  - W76 portal chooser (/p/select) renders for portal personas.
 *  - W45 marketplace apply page bounces logged-out visitors through login.
 */
import { expect, test } from "./helpers/base";
import { dismissConsent, fixtureEmail, loginAs, TEST_PASSWORD } from "./helpers/auth";

test.describe("admin view gates (P1-A)", () => {
  // The settings shell gates non-admins at the LAYOUT (src/app/(platform)/
  // console/settings/layout.tsx → <AccessDenied>) before the page's own copy,
  // so the canonical denial string is "You Don't Have Access".
  test("member is denied the billing settings view", async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "member");
    await page.goto("/studio/settings/billing");
    await expect(page.getByText("You Don't Have Access")).toBeVisible();
    // No billing data leaks into the denial view.
    await expect(page.locator("body")).not.toContainText(/Stripe|Invoice History|Current Plan/i);
  });

  test("member is denied the API keys settings view", async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "member");
    await page.goto("/studio/settings/api");
    await expect(page.getByText("You Don't Have Access")).toBeVisible();
    await expect(page.locator('input[name="name"]')).toHaveCount(0);
  });

  test("admin still sees the billing settings view", async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "admin");
    await page.goto("/studio/settings/billing");
    await expect(page.getByText("You Don't Have Access")).toHaveCount(0);
  });
});

test.describe("unauthenticated deep links (F4)", () => {
  test("console deep link round-trips through login via next param", async ({ page }) => {
    await dismissConsent(page);
    await page.goto("/studio/projects");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("next=");
    await page.fill('input[name="email"]', fixtureEmail("admin"));
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    // Accept BOTH the path-prefix form (/studio/projects — local/CI) AND the
    // per-product subdomain prod uses (app.atlvs.pro/projects). Without the
    // subdomain alternative this falsely fails against prod, where auth-resolve
    // correctly lands internal users on the app. host (see handoff-shells).
    await page.waitForURL(/\/studio\/projects|app\.atlvs\.pro\/projects/, { timeout: 30000 });
  });
});

test.describe("portal chooser (W76)", () => {
  test("client persona reaches /p/select or a project portal after login", async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "client");
    await page.goto("/p/select");
    // Either the chooser heading or (single-project case) a portal page.
    const chooser = page.getByRole("heading", { name: "Choose a Project" });
    const portalBody = page.locator("[data-portal-slug]");
    await expect(chooser.or(portalBody.first())).toBeVisible({ timeout: 20000 });
  });
});

test.describe("marketplace apply auth bounce (W45/F4)", () => {
  test("logged-out apply page redirects to login carrying next", async ({ page }) => {
    await dismissConsent(page);
    // Use a definitely-nonexistent slug: the page still requires a session
    // BEFORE resolving the posting, so the redirect fires first.
    await page.goto("/marketplace/gigs/readiness-probe/apply");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("next=");
  });
});

test.describe("cross-tenant slug isolation (F3)", () => {
  test("unknown portal slug is a hard 404", async ({ page }) => {
    await dismissConsent(page);
    const res = await page.goto("/p/definitely-not-a-real-slug-9f2/guide");
    expect(res?.status()).toBe(404);
  });
});
