import { expect, test, type Page } from "playwright/test";
import { authedSetup } from "./helpers/auth";

/**
 * Role × route DENIAL harness. The audit's systemic finding was that the
 * breadth crawls (ia-coverage-roles) assert only "no hard crash" — a route that
 * leaked foreign content or silently rendered for an unentitled role would
 * PASS. This harness asserts the opposite: for gated surfaces, a sub-threshold
 * role must actually be DENIED, and privileged content must NOT render.
 *
 * Two denial modes are both valid and both accepted:
 *   - in-shell AccessDenied ("You Don't Have Access") — for role=member personas
 *     that land in /studio but lack the finance/admin band;
 *   - redirect out of the route — for personas that don't belong in /studio at
 *     all (crew→/m, client/community→/me) and are bounced to their home shell.
 * What is NOT accepted: the gated content rendering in place (a leak) — that
 * fails, which is the whole point.
 *
 * Positive controls (manager sees finance/legend, admin sees settings) prove the
 * harness discriminates rather than always-denying.
 */

const ACCESS_DENIED = /you don'?t have access/i;

// Manager+ gated (finance/layout isManagerPlus; legend engine/compliance after
// the D2 gate). A signature bit of privileged content per route confirms a leak.
const MANAGER_PLUS_ROUTES: { route: string; content: RegExp }[] = [
  { route: "/studio/finance/invoices", content: /invoices?/i },
  { route: "/legend/engine", content: /compliance engine/i },
  { route: "/legend/compliance", content: /recert matrix/i },
];
// Admin gated (settings/layout resolves rank ≥ 3 for organization).
const ADMIN_ROUTES: { route: string; content: RegExp }[] = [{ route: "/studio/settings/organization", content: /organization/i }];

// Sub-manager personas — must be denied on manager+ routes.
const SUB_MANAGER = ["member", "collaborator", "contractor", "crew", "client", "viewer", "community"];
// Sub-admin — manager is below admin, plus everyone below manager.
const SUB_ADMIN = ["manager", ...SUB_MANAGER];

async function assertDenied(page: Page, route: string, content: RegExp) {
  const res = await page.goto(route);
  expect(res?.status() ?? 0, `${route} must not 5xx`).toBeLessThan(500);
  const landedHere = page.url().includes(route);
  const deniedInShell = (await page.getByText(ACCESS_DENIED).count()) > 0;
  // A denial is: bounced off the route, OR an in-shell AccessDenied. The one
  // thing that must never happen is the gated content rendering for this role.
  const denied = !landedHere || deniedInShell;
  expect(denied, `${route} must deny this role (redirect or AccessDenied)`).toBeTruthy();
  if (landedHere && deniedInShell) {
    // If we stayed on the route, the AccessDenied card must have REPLACED the
    // content — assert the privileged content heading is absent.
    await expect(
      page.locator("h1").filter({ hasText: content }),
      `${route} privileged content must not render for a denied role`,
    ).toHaveCount(0);
  }
}

async function assertAllowed(page: Page, route: string, content: RegExp) {
  await page.goto(route);
  await expect(page.getByText(ACCESS_DENIED), `${route} must not deny an authorized role`).toHaveCount(0);
  await expect(page.locator("h1").first(), `${route} renders content for an authorized role`).toBeVisible({
    timeout: 10_000,
  });
  expect(page.url(), `${route} authorized role stays on the route`).toContain(route);
  void content;
}

test.describe("Authz matrix — manager+ gated surfaces deny sub-manager roles", () => {
  test.describe.configure({ timeout: 180_000 });
  for (const role of SUB_MANAGER) {
    test(`${role} is denied every manager+ surface`, async ({ page }) => {
      await authedSetup(page, role);
      for (const { route, content } of MANAGER_PLUS_ROUTES) await assertDenied(page, route, content);
    });
  }
  test("manager (positive control) reaches the manager+ surfaces", async ({ page }) => {
    await authedSetup(page, "manager");
    for (const { route, content } of MANAGER_PLUS_ROUTES) await assertAllowed(page, route, content);
  });
});

test.describe("Authz matrix — admin gated surfaces deny sub-admin roles", () => {
  test.describe.configure({ timeout: 180_000 });
  for (const role of SUB_ADMIN) {
    test(`${role} is denied every admin surface`, async ({ page }) => {
      await authedSetup(page, role);
      for (const { route, content } of ADMIN_ROUTES) await assertDenied(page, route, content);
    });
  }
  test("admin (positive control) reaches the admin surfaces", async ({ page }) => {
    await authedSetup(page, "admin");
    for (const { route, content } of ADMIN_ROUTES) await assertAllowed(page, route, content);
  });
});
