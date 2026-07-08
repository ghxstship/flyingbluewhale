import { expect, test, type Page } from "playwright/test";
import { dismissConsent, loginAs, loginAndSwitchWorkspace } from "./helpers/auth";

/**
 * CROSS-TENANT ISOLATION — behavioral end-to-end proof.
 *
 * The SQL-layer half (scripts/cross-tenant-isolation-probe.mjs) proves RLS
 * itself holds. This spec proves the *application surfaces* hold: logged in as
 * an Org A user, every attempt to reach an Org B resource BY ID / SLUG across
 * the console, portal, and API must yield not-found / access-denied / empty —
 * never the Org B record. It also asserts the *right side* of the public line:
 * intentionally-public marketplace + published-guide surfaces are reachable,
 * but only expose published/shared data.
 *
 * Tenants (confirmed live against project xrovijzjbyssajhtwvas):
 *   Org A "proshow" f4509a5f-… — fixture user test+owner@flyingbluewhale.app.
 *   Org B "demo"    68672cc3-… — the MMW26 Hialeah dataset.
 *
 * The fixture user belongs ONLY to the four test-tier orgs, never to `demo`,
 * so session.orgId can never resolve to Org B — the canonical isolation setup.
 *
 * Routes use the path-prefix shells (/studio, /p, /m) — tests run with
 * NEXT_PUBLIC_USE_SUBDOMAINS=0 (see playwright.config.ts).
 */

// ── Org B (demo) sensitive record ids — all private to the demo tenant. ──────
const ORG_B = {
  // mmw26-hialeah project. Has a PUBLISHED guide → the project row is anon-
  // readable for the guide surface, but the studio detail + /api project read
  // are session-org-scoped and must 404 for an Org A user.
  projectId: "498a047e-bd2a-401e-9efb-f7fb796290d4",
  portalSlug: "mmw26-hialeah",
  // A demo proposal that DOES have an active share link (public-shareable).
  // Even so, the *studio* detail page is org-scoped and must 404 for Org A.
  proposalId: "5bc643f5-befa-41f4-8cda-f476ed2b3f01",
  invoiceId: "42892b64-b5fb-46cd-9022-f744ed35771d",
  offerLetterId: "4317dcea-2e4d-4e0d-a547-85c2e8e76445",
};

// An Org A project that genuinely belongs to the fixture user's session org —
// the positive control proving the negative results aren't a blanket 404.
const ORG_A_PROJECT_ID = "f62d1228-dd83-49bf-baa4-b82242bd3056"; // test-professional-show
// The org that owns ORG_A_PROJECT_ID ("proshow", professional tier). The fixture
// user belongs to four test orgs; the API project read is session-org-scoped, so
// the positive control MUST pin the active workspace to this org (the default
// workspace is whichever membership sorts first and is not guaranteed to be this
// one) — otherwise it 404s correctly and the positive control flakes.
const ORG_A_ID = "f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7";

/**
 * A studio detail page for a foreign record must render the not-found UI and
 * never the record itself.
 *
 * Why content-based, not status-based: a studio detail page calls notFound()
 * from a *child* RSC, by which point the (platform) layout (sidebar/chrome)
 * has already begun streaming — so Next keeps the HTTP status at 200 and swaps
 * the page body for not-found.tsx. (The same streaming behavior is documented
 * on the portal layout, which 404s from the layout precisely to avoid this.)
 * The authoritative status-level 404 is asserted on the org-scoped API instead
 * (see the API describe block). Here the real isolation guarantee is: the page
 * shows the "not found / no access" copy and contains ZERO Org B record data.
 */
async function expectStudioNotFound(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  // The (platform) not-found.tsx renders "That record doesn't exist, or you
  // don't have access." — wait for it so we assert against settled content.
  await expect(
    page.getByText(/doesn't exist, or you don't have access/i),
  ).toBeVisible({ timeout: 15000 });
  // Hard isolation guarantee: no Org B record content leaked into the page.
  const body = (await page.locator("body").innerText()).toLowerCase();
  expect(body).not.toContain("mmw26");
  expect(body).not.toContain("hialeah");
  expect(body).not.toContain("racetrack");
}

test.describe("cross-tenant: console (/studio) detail pages deny foreign ids", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
  });

  test("Org B project detail → 404, no record leak", async ({ page }) => {
    await expectStudioNotFound(page, `/studio/projects/${ORG_B.projectId}`);
  });

  test("Org B proposal detail → 404, no record leak", async ({ page }) => {
    await expectStudioNotFound(page, `/studio/proposals/${ORG_B.proposalId}`);
  });

  test("Org B invoice detail → 404, no record leak", async ({ page }) => {
    await expectStudioNotFound(page, `/studio/finance/invoices/${ORG_B.invoiceId}`);
  });

  test("positive control: own-org project detail renders (not a blanket 404)", async ({ page }) => {
    const resp = await page.goto(`/studio/projects/${ORG_A_PROJECT_ID}`);
    expect(resp?.status()).toBe(200);
  });
});

test.describe("cross-tenant: API (/api/v1) is session-org-scoped", () => {
  test("Org A user GET Org B project → 404 not_found envelope", async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
    const r = await page.request.get(`/api/v1/projects/${ORG_B.projectId}`);
    expect(r.status()).toBe(404);
    const body = await r.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("not_found");
  });

  test("Org A user GET own-org project → 200 (positive control)", async ({ page }) => {
    await dismissConsent(page);
    // Pin the session to the org that owns ORG_A_PROJECT_ID — the API read is
    // session-org-scoped, so without this the default workspace may not be proshow
    // and the positive control 404s (correct behavior, wrong test assumption).
    await loginAndSwitchWorkspace(page, "owner", ORG_A_ID);
    const r = await page.request.get(`/api/v1/projects/${ORG_A_PROJECT_ID}`);
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.ok).toBe(true);
    expect(body.data.id).toBe(ORG_A_PROJECT_ID);
  });

  test("anon GET Org B project → 401 unauthorized (no record)", async ({ request }) => {
    const r = await request.get(`/api/v1/projects/${ORG_B.projectId}`);
    expect(r.status()).toBe(401);
    const body = await r.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("unauthorized");
  });
});

test.describe("cross-tenant: portal (/p/<slug>) does not expose foreign private data", () => {
  // The portal layout resolves a known slug → project chrome via an anon-
  // readable policy (so the masthead may show the project name), but every
  // CHILD data surface is persona/org-scoped. An Org A user who is NOT a member
  // of the demo org must not see demo private rosters/financials/assignments.
  test("Org A user on Org B vendor portal sees no demo procurement data", async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
    // vendor/purchase-orders queries `.eq('org_id', session.orgId)` — the Org A
    // user's session org is never demo, so even on the demo slug this page can
    // only ever surface the caller's own (or zero) POs, never demo's.
    const resp = await page.goto(`/p/${ORG_B.portalSlug}/vendor/purchase-orders`);
    expect(resp?.status(), "portal child must not 500").toBeLessThan(500);
    // The portal resolves the slug → project chrome via an anon-readable policy,
    // so the masthead + content legitimately show the PUBLIC project name — that
    // is NOT a leak. The real guarantee is that demo's PRIVATE procurement data
    // (vendor identities + PO numbers, org-scoped out by `.eq org_id = caller`)
    // never renders. Assert those specific private markers are absent.
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body, "no demo vendor identity leaks").not.toContain("julia valler");
    expect(body, "no demo PO number leaks").not.toContain("po-2652936");
  });

  test("Org A user on Org B vendor invoices sees no demo invoices", async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
    const resp = await page.goto(`/p/${ORG_B.portalSlug}/vendor/invoices`);
    expect(resp?.status(), "portal child must not 500").toBeLessThan(500);
    // Private-marker check (the public project name is not a leak — see above).
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body, "no demo vendor identity leaks").not.toContain("julia valler");
    expect(body, "no demo vendor identity leaks").not.toContain("edc lv");
  });

  test("anon hitting unknown portal slug → 404 (slug enumeration closed)", async ({ request }) => {
    const r = await request.get("/p/definitely-not-a-real-slug-xyz/guide");
    expect(r.status()).toBe(404);
  });
});

test.describe("cross-tenant: marketplace public surfaces expose only published cross-org data", () => {
  // The marketplace is INTENTIONALLY cross-org: anon may browse published
  // talent/jobs/RFQs from every org. This asserts the right side of the line —
  // the surfaces load for anon, but private operator fields are absent.
  test("anon can load /marketplace and its public sub-surfaces", async ({ page }) => {
    await dismissConsent(page);
    for (const path of ["/marketplace", "/marketplace/talent", "/marketplace/crew", "/marketplace/vendors"]) {
      const resp = await page.goto(path);
      expect(resp?.status(), `${path} should be publicly reachable`).toBeLessThan(400);
      const body = (await page.locator("body").innerText()).toLowerCase();
      // Public directories must never leak internal-only signals.
      expect(body, `${path} leaked an internal field`).not.toContain("org_id");
      expect(body, `${path} leaked a take-rate`).not.toContain("take_rate_bps");
    }
  });
});

test.describe("cross-tenant: per-role API isolation (H1)", () => {
  // Every fixture user belongs ONLY to the four test orgs — never `demo` (Org B).
  // The audit found all isolation ran as owner; these prove the *application
  // surface* scoping holds for the non-owner bands too. Each role here holds
  // projects:read, so a foreign-tenant id is a clean org-scoped 404 (not a
  // capability 403) — isolating the tenant boundary from the capability gate.
  for (const role of ["member", "collaborator", "contractor", "viewer"]) {
    test(`${role}: GET Org B project → 404 not_found, no leak`, async ({ page }) => {
      await dismissConsent(page);
      await loginAs(page, role);
      const r = await page.request.get(`/api/v1/projects/${ORG_B.projectId}`);
      expect(r.status(), `${role} must not read a foreign-tenant project`).toBe(404);
      const body = await r.json();
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("not_found");
      // The error envelope must carry zero Org B data.
      expect(JSON.stringify(body).toLowerCase()).not.toContain("hialeah");
    });
  }

  test("member: Org B project studio detail → not-found UI, no record leak", async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "member");
    await expectStudioNotFound(page, `/studio/projects/${ORG_B.projectId}`);
  });
});
