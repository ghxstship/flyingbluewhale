import { expect, test, type Page, type BrowserContext } from "playwright/test";

/**
 * Cross-shell HANDOFF suite.
 *
 * Exercises the seams between the three branded shells of the platform:
 *   - `atlvs`   (platform, /console, internal ops)
 *   - `gvteway` (portal,   /p/[slug], external partners & guests)
 *   - `compvss` (mobile,   /m,       field crews, PWA)
 *
 * A "handoff" is any interaction where:
 *   (a) a user's session decides which shell they land in, OR
 *   (b) data produced in one shell must render in another with the correct
 *       authorization boundary + persona mapping.
 *
 * Fixtures assumed (seeded via Supabase MCP before the suite runs):
 *   - 4 test orgs × 10 test users (seeded by seed-test-fixtures) with shared
 *     password FlyingBlue!Test2026 and email test+{role}@flyingbluewhale.app
 *   - 4 active test projects (test-portal-show, test-starter-show,
 *     test-professional-show, test-enterprise-show)
 *   - 5 personas × 4 projects = 20 published event_guides with a deterministic
 *     subtitle marker `HANDOFF:<persona>:<project-slug>` used for assertions.
 *   - The demo org still owns `mmw26-hialeah` with the public guest guide.
 *
 * The test intentionally does NOT use service_role — it reads the same data
 * paths a real user would, which is the point of a handoff test.
 */

const PASSWORD = "FlyingBlue!Test2026";
const TEST_EMAIL = (role: string) => `test+${role}@flyingbluewhale.app`;

type RoleKey =
  | "owner" | "admin" | "controller" | "collaborator" | "developer"
  | "contractor" | "crew" | "client" | "viewer" | "community";

// The /auth/resolve contract. These are the shell landings we guarantee.
const SHELL_EXPECT: Record<RoleKey, RegExp> = {
  owner: /\/console(?:$|[/?])/,
  admin: /\/console(?:$|[/?])/,
  controller: /\/console(?:$|[/?])/,
  collaborator: /\/console(?:$|[/?])/,
  developer: /\/console(?:$|[/?])/,
  contractor: /\/p(?:$|\/)/,
  crew: /\/m(?:$|[/?])/,
  client: /\/p(?:$|\/)/,
  viewer: /\/me(?:$|[/?])/,
  community: /\/me(?:$|[/?])/,
};

const INTERNAL_ROLES: RoleKey[] = ["owner", "admin", "controller", "collaborator", "developer"];
const PORTAL_ROLES: RoleKey[] = ["client", "contractor"];
const MOBILE_ROLES: RoleKey[] = ["crew"];
const PERSONAL_ROLES: RoleKey[] = ["viewer", "community"];

async function dismissConsent(ctx: BrowserContext) {
  await ctx.addCookies([
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

async function login(page: Page, role: RoleKey) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(TEST_EMAIL(role));
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 15000 });
}

// ---------------------------------------------------------------------------
// Handoff 1 — /auth/resolve: session.persona → shell landing
// ---------------------------------------------------------------------------
test.describe("handoff/auth-resolve: session → shell", () => {
  for (const role of INTERNAL_ROLES) {
    test(`${role} → atlvs (/console)`, async ({ page, context }) => {
      await dismissConsent(context);
      await login(page, role);
      await page.goto("/auth/resolve");
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toMatch(SHELL_EXPECT[role]);
      // Shell chrome marker — data-platform attribute must be present.
      await expect(page.locator('[data-platform="atlvs"]').first()).toBeVisible({ timeout: 10_000 });
    });
  }

  for (const role of PORTAL_ROLES) {
    test(`${role} → gvteway (/p)`, async ({ page, context }) => {
      await dismissConsent(context);
      await login(page, role);
      await page.goto("/auth/resolve");
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toMatch(SHELL_EXPECT[role]);
    });
  }

  for (const role of MOBILE_ROLES) {
    test(`${role} → compvss (/m)`, async ({ page, context }) => {
      await dismissConsent(context);
      await login(page, role);
      await page.goto("/auth/resolve");
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toMatch(SHELL_EXPECT[role]);
      await expect(page.locator('[data-platform="compvss"]').first()).toBeVisible({ timeout: 10_000 });
    });
  }

  for (const role of PERSONAL_ROLES) {
    test(`${role} → personal (/me)`, async ({ page, context }) => {
      await dismissConsent(context);
      await login(page, role);
      await page.goto("/auth/resolve");
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toMatch(SHELL_EXPECT[role]);
    });
  }

  test("unauthenticated /auth/resolve → /login", async ({ page, context }) => {
    await dismissConsent(context);
    await page.goto("/auth/resolve");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/login/);
  });
});

// ---------------------------------------------------------------------------
// Handoff 2 — atlvs → gvteway: guide rendered in portal for each persona
// ---------------------------------------------------------------------------
test.describe("handoff/atlvs→gvteway: guide render in portal", () => {
  // Each role hits their own org's project portal. Because test users are
  // members of every test org, any test-<tier>-show slug is reachable; we use
  // test-professional-show as the canonical target.
  const SLUG = "test-professional-show";

  const PERSONA_FOR_ROLE: Record<RoleKey, string> = {
    owner: "staff", admin: "staff", controller: "staff",
    collaborator: "staff", developer: "staff",
    contractor: "vendor", client: "client", crew: "crew",
    viewer: "guest", community: "guest",
  };

  const PORTAL_VIEWERS: RoleKey[] = ["client", "contractor", "owner"];

  for (const role of PORTAL_VIEWERS) {
    test(`${role} reads /p/${SLUG}/guide and sees ${PERSONA_FOR_ROLE[role]} marker`, async ({ page, context }) => {
      await dismissConsent(context);
      await login(page, role);
      await page.goto(`/p/${SLUG}/guide`);
      // Portal shell chrome
      await expect(page.locator('[data-platform="gvteway"]').first()).toBeVisible({ timeout: 10_000 });
      // Subtitle marker survives the atlvs → gvteway hop.
      const marker = `HANDOFF:${PERSONA_FOR_ROLE[role]}:${SLUG}`;
      await expect(page.locator("body")).toContainText(marker, { timeout: 10_000 });
    });
  }

  test("anon (no session) sees published guest guide on test-portal-show", async ({ page, context }) => {
    await dismissConsent(context);
    // No login — rely on projects_select_if_guide_published + event_guides_select_public.
    await page.goto("/p/test-portal-show/guide");
    await expect(page.locator('[data-platform="gvteway"]').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("body")).toContainText("HANDOFF:guest:test-portal-show", { timeout: 10_000 });
  });

  test("anon can still read the long-standing mmw26-hialeah guest guide", async ({ page, context }) => {
    await dismissConsent(context);
    await page.goto("/p/mmw26-hialeah/guide");
    await expect(page.locator('[data-platform="gvteway"]').first()).toBeVisible({ timeout: 10_000 });
    // Seeded guide title from production seed — use a stable substring.
    await expect(page.locator("body")).toContainText(/open air|welcome/i, { timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Handoff 3 — atlvs → compvss: crew sees their persona on /m/guide
// ---------------------------------------------------------------------------
test.describe("handoff/atlvs→compvss: guide render on mobile", () => {
  test("crew reads /m/guide and sees crew marker from most-recent active project", async ({ page, context }) => {
    await dismissConsent(context);
    await login(page, "crew");
    await page.goto("/m/guide");
    await expect(page.locator('[data-platform="compvss"]').first()).toBeVisible({ timeout: 10_000 });
    // crew persona × any of the 4 test projects — all seeded with HANDOFF:crew:...
    await expect(page.locator("body")).toContainText(/HANDOFF:crew:test-[a-z]+-show/, { timeout: 10_000 });
  });

  test("internal role viewing /m/guide maps to staff persona", async ({ page, context }) => {
    await dismissConsent(context);
    await login(page, "owner");
    await page.goto("/m/guide");
    // owner → staff mapping asserted by the subtitle marker.
    await expect(page.locator("body")).toContainText(/HANDOFF:staff:test-[a-z]+-show/, { timeout: 10_000 });
  });

  test("client viewing /m/guide maps to client persona", async ({ page, context }) => {
    await dismissConsent(context);
    await login(page, "client");
    await page.goto("/m/guide");
    await expect(page.locator("body")).toContainText(/HANDOFF:client:test-[a-z]+-show/, { timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Handoff 4 — persona-mapping consistency across gvteway + compvss
// ---------------------------------------------------------------------------
test.describe("handoff/persona-consistency: same role sees same persona in both portal and mobile", () => {
  test("owner sees staff persona in BOTH portal and mobile", async ({ page, context }) => {
    await dismissConsent(context);
    await login(page, "owner");

    await page.goto("/p/test-professional-show/guide");
    await expect(page.locator("body")).toContainText("HANDOFF:staff:test-professional-show", { timeout: 10_000 });

    await page.goto("/m/guide");
    await expect(page.locator("body")).toContainText(/HANDOFF:staff:test-[a-z]+-show/, { timeout: 10_000 });
  });

  test("client sees client persona in BOTH portal and mobile", async ({ page, context }) => {
    await dismissConsent(context);
    await login(page, "client");

    await page.goto("/p/test-professional-show/guide");
    await expect(page.locator("body")).toContainText("HANDOFF:client:test-professional-show", { timeout: 10_000 });

    await page.goto("/m/guide");
    await expect(page.locator("body")).toContainText(/HANDOFF:client:test-[a-z]+-show/, { timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Handoff 5 — cross-shell authorization boundary
// Internal ops in /console must NOT render the gvteway/compvss shell chrome
// (and vice versa). This guards against accidentally leaking the wrong layout.
// ---------------------------------------------------------------------------
test.describe("handoff/shell-isolation: each shell renders only its own data-platform marker", () => {
  test("console root carries atlvs only (no gvteway/compvss)", async ({ page, context }) => {
    await dismissConsent(context);
    await login(page, "owner");
    await page.goto("/console");
    await expect(page.locator('[data-platform="atlvs"]').first()).toBeVisible();
    expect(await page.locator('[data-platform="gvteway"]').count()).toBe(0);
    expect(await page.locator('[data-platform="compvss"]').count()).toBe(0);
  });

  test("portal slug carries gvteway only (no atlvs/compvss)", async ({ page, context }) => {
    await dismissConsent(context);
    await login(page, "client");
    await page.goto("/p/test-professional-show/guide");
    await expect(page.locator('[data-platform="gvteway"]').first()).toBeVisible();
    expect(await page.locator('[data-platform="atlvs"]').count()).toBe(0);
    expect(await page.locator('[data-platform="compvss"]').count()).toBe(0);
  });

  test("mobile carries compvss only (no atlvs/gvteway)", async ({ page, context }) => {
    await dismissConsent(context);
    await login(page, "crew");
    await page.goto("/m");
    await expect(page.locator('[data-platform="compvss"]').first()).toBeVisible();
    expect(await page.locator('[data-platform="atlvs"]').count()).toBe(0);
    expect(await page.locator('[data-platform="gvteway"]').count()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Handoff 6 — sign-out must drop all three shells back to /login
// ---------------------------------------------------------------------------
test.describe("handoff/signout: cleared session locks every protected shell", () => {
  test("after clearing cookies, /console redirects to /login", async ({ page, context }) => {
    await dismissConsent(context);
    await login(page, "owner");
    await context.clearCookies();
    await dismissConsent(context);
    const resp = await page.goto("/console");
    // Either redirected to login, or we're on a page containing the login form.
    expect(page.url()).toMatch(/\/login/);
    expect(resp?.status()).toBeLessThan(500);
  });

  test("after clearing cookies, /m redirects to /login", async ({ page, context }) => {
    await dismissConsent(context);
    await login(page, "crew");
    await context.clearCookies();
    await dismissConsent(context);
    await page.goto("/m");
    expect(page.url()).toMatch(/\/login/);
  });
});

// ---------------------------------------------------------------------------
// Handoff 7 — portal slug authorization: published-guide-only anon access
// A slug with NO published guide must not leak the project to anon.
// ---------------------------------------------------------------------------
test.describe("handoff/slug-rls: anon can only see slugs with a published guide", () => {
  test("anon can resolve test-professional-show because a guide is published", async ({ page, context }) => {
    await dismissConsent(context);
    const resp = await page.goto("/p/test-professional-show/guide");
    expect(resp?.status()).toBeLessThan(500);
    // A guide for some persona is published — should render gvteway chrome.
    await expect(page.locator('[data-platform="gvteway"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test("anon gets 404 on a slug that does not exist", async ({ page, context }) => {
    await dismissConsent(context);
    const resp = await page.goto("/p/this-slug-does-not-exist-xyz/guide");
    // notFound() from the page → 404.
    expect(resp?.status()).toBe(404);
  });
});
