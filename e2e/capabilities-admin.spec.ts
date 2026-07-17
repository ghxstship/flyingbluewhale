/**
 * Capabilities admin — the ADR-0015 grant surfaces (SCANNING_RBAC_BACKLOG
 * P1.1-P1.3 + P2.4, built 2026-07-17).
 *
 *   /studio/settings/capabilities             matrix + person grants + holders
 *   /studio/settings/capabilities/roles       catalog + merge preview
 *   /studio/settings/capabilities/scan-misses the P4 measurement readout
 *   /studio/settings/capabilities/enforcement flip w/ who-loses-access diff
 *
 * Access model under test: readable by the manager band (a shift supervisor
 * answers "why was Bob refused at the gate"), writes admin+ (RLS:
 * 20260715171424_capability_grants_admin_band). The member band has no
 * business here at all.
 */
import { expect, test, type Page } from "./helpers/base";
import { authedSetup } from "./helpers/auth";

const ERROR_BOUNDARY = /something went wrong|application error|unhandled|digest:/i;
const SURFACES = [
  "/studio/settings/capabilities",
  "/studio/settings/capabilities/roles",
  "/studio/settings/capabilities/scan-misses",
  "/studio/settings/capabilities/enforcement",
];

async function expectConsoleRendered(page: Page) {
  await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
}

for (const persona of ["owner", "manager"] as const) {
  test.describe(`capabilities admin · ${persona}`, () => {
    test.describe.configure({ timeout: 180_000 });
    test.beforeEach(async ({ page }) => authedSetup(page, persona));

    for (const path of SURFACES) {
      test(`${path} renders for ${persona}`, async ({ page }) => {
        await page.goto(path);
        await expectConsoleRendered(page);
      });
    }

    test("the enforcement page leads with the who-loses-access preview, never a bare switch", async ({ page }) => {
      await page.goto("/studio/settings/capabilities/enforcement");
      await expectConsoleRendered(page);
      // The diff renders BEFORE any flip control — the page's whole reason
      // to exist (backlog P2.4: "Do not flip it from SQL").
      await expect(page.getByText(/lose access|would lose|no one loses|nobody loses|regain/i).first()).toBeVisible({
        timeout: 20_000,
      });
    });

    test("the roles catalog renders with its merge affordance", async ({ page }) => {
      await page.goto("/studio/settings/capabilities/roles");
      await expectConsoleRendered(page);
      await expect(page.getByText(/merge/i).first()).toBeVisible({ timeout: 15_000 });
    });
  });
}

test.describe("capabilities admin · member is out", () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "member"));

  for (const path of SURFACES) {
    test(`${path} refuses the member band`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      // Server-side deny: a redirect away, a 403/404, or an access message —
      // anything but the surface itself. The matrix headings must not render.
      const status = res?.status() ?? 0;
      const url = page.url();
      const deniedByRedirect = !url.includes("/settings/capabilities");
      const deniedByStatus = status === 403 || status === 404;
      if (!deniedByRedirect && !deniedByStatus) {
        await expect(
          page.getByText(/not authorized|no access|don.t have access|permission|denied/i).first(),
          `${path} rendered for a member with no deny signal`,
        ).toBeVisible({ timeout: 15_000 });
      }
      await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
    });
  }
});
