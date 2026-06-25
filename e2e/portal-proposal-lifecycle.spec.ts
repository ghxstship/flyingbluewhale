/**
 * Portal client-proposal lifecycle — the externally-facing GVTEWAY surface a
 * client uses to review a proposal: read the proposal + its phases/gates, and
 * request creative revisions / scope change-orders. Previously render-only
 * (portal.spec just checks "one subpage per persona renders"); this drives the
 * real client actions.
 *
 * Fixture: proposal `E2E Portal Proposal — Fixture` seeded into the
 * test-professional-show project (Test Professional org). The client fixture
 * user is a member of that org, so RLS resolves the proposal context.
 */
import { expect, test } from "playwright/test";
import { dismissConsent, loginAndSwitchWorkspace } from "./helpers/auth";
import { stamp } from "./helpers/forms";

const SLUG = "test-professional-show";
const PROPOSAL_ID = "3e7fbd4f-0f30-4cb0-b1e0-57ff7ae727b5";
const PROFESSIONAL_ORG_ID = "f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7";
const base = `/p/${SLUG}/client/proposals/${PROPOSAL_ID}`;

test.describe("portal — client proposal lifecycle", () => {
  test.describe.configure({ timeout: 120000 });
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "client", PROFESSIONAL_ORG_ID);
  });

  test("client can read the proposal + its lifecycle sub-pages", async ({ page }) => {
    for (const path of [base, `${base}/revisions`, `${base}/change-orders`, `${base}/lifecycle`, `${base}/approvals`]) {
      const r = await page.goto(path);
      expect(r?.status(), `${path} should not be a 4xx/5xx`).toBeLessThan(400);
      await expect(page.locator('[data-platform="gvteway"]').first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/not found/i)).toHaveCount(0);
    }
  });

  // The portal FormShell isn't wrapped in <main> like the console forms, so the
  // generic createInModule helper can't target it — submit the FormShell directly.
  async function submitFormShell(page: import("playwright/test").Page, route: string, fields: Record<string, string>) {
    await page.goto(route);
    for (const [name, value] of Object.entries(fields)) {
      const el = page.locator(`[name="${name}"]`).first();
      if (await el.count()) await el.fill(value);
    }
    // The portal isn't wrapped in <main> and has several forms (header search,
    // nav). Submit the FormShell that actually contains the title <input> — by
    // its name attribute — via requestSubmit (FormShell dispatches the action on
    // submit). This is the portal analogue of the console `main form` helper.
    await page
      .locator('form:has([name="title"])')
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page).not.toHaveURL(/\/new(\?|$)/, { timeout: 35000 });
    await expect(page.getByRole("alert").filter({ hasText: /error|failed|invalid/i })).toHaveCount(0);
  }

  // Skipped — characterized precisely: the form DOES submit (POST 200) and the
  // server action runs, but `createChangeOrder`/`createRevisionRound` look the
  // proposal up with `.eq("org_id", actor.orgId)`, and the client's active org in
  // Un-skipped 2026-06-25: these were skipped on a mis-diagnosis (blamed on
  // org/session resolution). The real cause was createChangeOrderAction /
  // createRevisionRoundAction calling redirect() INSIDE a try/catch — the catch
  // swallowed the NEXT_REDIRECT throw, so the row was written but the user was
  // stranded on /new. Fixed by hoisting redirect() out of the try; guarded by
  // src/lib/portal-action-redirect-canon.test.ts.
  test("client requests a scope change-order", async ({ page }) => {
    await submitFormShell(page, `${base}/change-orders/new`, {
      title: `E2E Change Order ${stamp()}`,
      body: "Requesting an added LED wall per the revised scope.",
    });
  });

  test("client requests a creative revision round", async ({ page }) => {
    await submitFormShell(page, `${base}/revisions/new`, {
      title: `E2E Revision ${stamp()}`,
      summary: "Tighten the timeline and refresh the moodboard.",
    });
  });
});
