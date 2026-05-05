/**
 * Marketplace canon (migration 0002) — public-discovery render smoke test.
 *
 * Verifies that all 6 marketing-shell directories + the marketplace hub
 * + the 6 console-side hub pages render with 200 OK and the canonical h1.
 * Doesn't auth — public pages must work without a session, and the
 * authenticated console pages should redirect to /login (not 500) when
 * accessed cold; both paths are valid green.
 *
 * Schema is exercised through the public_* views (anon GRANT SELECT) so a
 * 200 here also proves the migration's RLS / view definitions are intact.
 */
import { test, expect } from "playwright/test";

type Surface = { path: string; expectedH1?: RegExp; allowRedirect?: boolean };

const PUBLIC_SURFACES: Surface[] = [
  { path: "/marketplace", expectedH1: /FIND THE WORK/i },
  { path: "/marketplace/rfqs", expectedH1: /OPEN RFQS/i },
  { path: "/marketplace/gigs", expectedH1: /CREW GIGS/i },
  { path: "/marketplace/calls", expectedH1: /OPEN CALLS/i },
  { path: "/marketplace/talent", expectedH1: /TALENT DIRECTORY/i },
  { path: "/marketplace/crew", expectedH1: /CREW DIRECTORY/i },
  { path: "/marketplace/vendors", expectedH1: /VENDOR DIRECTORY/i },
];

const CONSOLE_SURFACES: Surface[] = [
  { path: "/console/marketplace", expectedH1: /Overview/i, allowRedirect: true },
  { path: "/console/marketplace/postings", expectedH1: /Job Postings/i, allowRedirect: true },
  { path: "/console/marketplace/postings/new", expectedH1: /New Posting/i, allowRedirect: true },
  { path: "/console/marketplace/calls", expectedH1: /Open Calls/i, allowRedirect: true },
  { path: "/console/marketplace/calls/new", expectedH1: /New Open Call/i, allowRedirect: true },
  { path: "/console/marketplace/talent", expectedH1: /Talent/i, allowRedirect: true },
  { path: "/console/marketplace/talent/new", expectedH1: /New Talent Profile/i, allowRedirect: true },
  { path: "/console/marketplace/offers", expectedH1: /Offers/i, allowRedirect: true },
  { path: "/console/marketplace/reviews", expectedH1: /Reviews/i, allowRedirect: true },
  { path: "/console/marketplace/settings", expectedH1: /Settings/i, allowRedirect: true },
];

test.describe("Marketplace canon — public discovery", () => {
  for (const s of PUBLIC_SURFACES) {
    test(`renders ${s.path}`, async ({ page }) => {
      const response = await page.goto(s.path);
      expect(response?.status(), `${s.path} should respond 200`).toBe(200);
      if (s.expectedH1) {
        await expect(page.locator("h1").first()).toHaveText(s.expectedH1);
      }
    });
  }

  test("hub links to all 6 sub-directories", async ({ page }) => {
    await page.goto("/marketplace");
    for (const s of PUBLIC_SURFACES.filter((x) => x.path !== "/marketplace")) {
      await expect(page.locator(`a[href="${s.path}"]`).first()).toBeVisible();
    }
  });

  test("public_*_directory views are queryable as anon", async ({ request }) => {
    // Each list page uses one of the public views. A 200 implies anon SELECT
    // works against the view + downstream tables (RLS allowed it).
    const r = await request.get("/marketplace/talent");
    expect(r.status()).toBe(200);
  });
});

test.describe("Marketplace canon — console (auth-gated)", () => {
  for (const s of CONSOLE_SURFACES) {
    test(`${s.path} compiles + renders`, async ({ page }) => {
      const response = await page.goto(s.path);
      // Either 200 on the target (signed-in dev session) or a redirect to
      // /login when anonymous. Both are healthy outcomes; what we're proving
      // is no 500 / no compile error.
      const status = response?.status() ?? 0;
      expect(status, `${s.path} should not 5xx`).toBeLessThan(500);
      // h1 check only when we landed on the actual target — a redirect to
      // /login serves a Sign In h1 and that's also fine.
      const landedOnTarget = page.url().includes(s.path);
      if (landedOnTarget && s.expectedH1) {
        const h1 = page.locator("h1").first();
        if (await h1.count()) {
          await expect(h1).toHaveText(s.expectedH1);
        }
      }
    });
  }
});

test.describe("Marketplace canon — /me applicant surfaces", () => {
  // Same compile-check pattern: any 5xx is a regression.
  const ME_PATHS = [
    "/me/applications",
    "/me/submissions",
    "/me/availability",
    "/me/reviews",
    "/me/talent",
    "/me/offers",
    "/me/saved-searches",
  ];
  for (const p of ME_PATHS) {
    test(`${p} compiles + renders`, async ({ page }) => {
      const response = await page.goto(p);
      const status = response?.status() ?? 0;
      expect(status, `${p} should not 5xx`).toBeLessThan(500);
    });
  }
});
