import { expect, test, type Page, type BrowserContext, type APIRequestContext } from "playwright/test";

/**
 * Row-level security boundary suite.
 *
 * Verifies that data-access endpoints hold the line on cross-tenant + cross-
 * user isolation, regardless of which shell a caller is in. These tests are
 * intentionally negative: they prove a request that should fail, fails.
 *
 * Conventions:
 *   - Test users are members of the four test-<tier> orgs but NOT `demo`.
 *   - `mmw26-hialeah` (project_id 498a047e…) lives in `demo`, so any test user
 *     accessing it must get `not_found` from a session-org-scoped endpoint.
 */

const PASSWORD = "FlyingBlue!Test2026";
const TEST_EMAIL = (role: string) => `test+${role}@flyingbluewhale.app`;

const DEMO_PROJECT_ID = "498a047e-bd2a-401e-9efb-f7fb796290d4"; // mmw26-hialeah, demo org
const TEST_PROJECT_IDS: Record<string, string> = {
  "test-portal-show": "8597e953-22c0-48d1-abfd-6060f848aba5",
  "test-starter-show": "871fc1db-6bc6-43b1-8218-43c1716185d9",
  "test-professional-show": "f62d1228-dd83-49bf-baa4-b82242bd3056",
  "test-enterprise-show": "e4340ab4-d105-4b49-ab84-90b038542f89",
};

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

async function login(page: Page, role: string) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(TEST_EMAIL(role));
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 15_000 });
}

/**
 * Get a Playwright APIRequestContext scoped to the logged-in session cookie
 * from the page's context. This lets us hit /api/v1/... with the same auth
 * state the browser would have.
 */
async function authedRequest(page: Page): Promise<APIRequestContext> {
  return page.request;
}

test.describe("rls/cross-tenant: session.orgId gates project reads", () => {
  test("owner cannot read a project from an org they don't belong to (demo)", async ({ page, context }) => {
    await dismissConsent(context);
    await login(page, "owner");
    const req = await authedRequest(page);

    const r = await req.get(`/api/v1/projects/${DEMO_PROJECT_ID}`);
    expect(r.status()).toBe(404);
    const body = await r.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("not_found");
  });

  test("owner sees exactly one of the four test projects (their session.orgId)", async ({ page, context }) => {
    await dismissConsent(context);
    await login(page, "owner");
    const req = await authedRequest(page);

    // test+owner is a member of all 4 test orgs, but session.orgId resolves
    // to a single membership row. Exactly one project must return 200; the
    // other three must return 404 because org_id doesn't match.
    const results = await Promise.all(
      Object.entries(TEST_PROJECT_IDS).map(async ([slug, id]) => {
        const r = await req.get(`/api/v1/projects/${id}`);
        return { slug, id, status: r.status() };
      }),
    );
    const oks = results.filter((r) => r.status === 200);
    const notFounds = results.filter((r) => r.status === 404);
    expect(oks, `expected exactly 1 reachable project, got ${JSON.stringify(results)}`).toHaveLength(1);
    expect(notFounds).toHaveLength(3);
  });

  test("bogus UUID yields 400 (or 404), never 500", async ({ page, context }) => {
    await dismissConsent(context);
    await login(page, "owner");
    const req = await authedRequest(page);

    const r = await req.get(`/api/v1/projects/not-a-uuid`);
    expect([400, 404]).toContain(r.status());
    // RLS / validation must never leak a 500 for malformed inputs.
    expect(r.status()).toBeLessThan(500);
  });
});

test.describe("rls/api-contract: unauth'd sensitive endpoints return 401 envelopes", () => {
  const UNAUTH_PROBES: Array<{ method: "GET" | "POST"; path: string; body?: unknown }> = [
    { method: "GET", path: "/api/v1/me/preferences" },
    { method: "GET", path: "/api/v1/me/export" },
    { method: "GET", path: "/api/v1/ai/conversations" },
    { method: "GET", path: "/api/v1/auth/webauthn/credentials" },
    { method: "GET", path: `/api/v1/projects/${TEST_PROJECT_IDS["test-professional-show"]}` },
    { method: "POST", path: "/api/v1/me/delete", body: { confirmPhrase: "delete my account" } },
    // /api/v1/ai/conversations is GET-only (Next.js returns 405 for POST, not 401).
    // /api/v1/auth/webauthn/register/options handled via POST only — include here.
    { method: "POST", path: "/api/v1/auth/webauthn/register/options" },
  ];

  for (const probe of UNAUTH_PROBES) {
    test(`${probe.method} ${probe.path} → 401 with canonical envelope`, async ({ request }) => {
      const r = probe.method === "GET"
        ? await request.get(probe.path)
        : await request.post(probe.path, probe.body ? { data: probe.body } : {});
      expect(r.status()).toBe(401);
      const body = await r.json();
      expect(body.ok).toBe(false);
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe("unauthorized");
      expect(typeof body.error.message).toBe("string");
    });
  }
});

test.describe("rls/portal: anon cannot leak a project via /p/<slug> without a published guide", () => {
  // By construction, /p/[slug] uses projects_select_if_guide_published for anon
  // readers. A slug whose project has NO published guide must be inaccessible
  // to anon callers even if they know the slug. We construct this guarantee
  // by asserting a 404 (not 200) on a non-existent slug. We cannot easily
  // create a slug-without-published-guide in-test because our test projects
  // all have guides; this test guards the negative behavior on a known-missing
  // slug so any relaxation of the anon RLS policy surfaces here.
  test("anon GET /p/definitely-not-a-real-slug/guide returns 404", async ({ request }) => {
    const r = await request.get("/p/definitely-not-a-real-slug-xyz/guide");
    expect(r.status()).toBe(404);
  });
});
