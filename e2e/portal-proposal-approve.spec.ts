import { test, expect } from "./helpers/base";
import { dismissConsent, loginAndSwitchWorkspace } from "./helpers/auth";
import { PROPOSAL_APPROVAL_FIXTURE as F } from "./helpers/fixtures";

/**
 * C2 — the proposals:approve sign-off boundary. Signing/declining a proposal
 * approval is a binding, legally-meaningful act reserved for the CLIENT (and
 * secondary-signer VIEWER) persona — capability `proposals:approve` — plus
 * operator manager+. Before this spec the boundary was guarded only by a unit
 * test (portal-proposal-approve-canon.test.ts); no e2e drove it, so the exact
 * past authz bug it was written to prevent (any org member signing a client's
 * approval) had no end-to-end witness.
 *
 * Non-destructive by design. The sign action checks the capability BEFORE it
 * validates the typed name (src/.../approvals/actions.ts). The name <input> is
 * HTML5-`required`, but the server TRIMS it — so submitting whitespace clears
 * native validation yet the server sees an empty name. Thus:
 *   - a capability holder (client/viewer) falls through to "type your name to
 *     sign" — proving they passed the gate, WITHOUT signing;
 *   - a non-holder (crew) is stopped at the capability check with APPROVE_DENIED.
 * The approval is never mutated, so the fixture stays reusable across runs.
 */
const url = `/p/${F.projectSlug}/client/proposals/${F.proposalId}/approvals/${F.approvalId}`;
const WHITESPACE_NAME = "   ";
const DENIED = /not authorized to act on this approval/i;
const NAME_REQUIRED = /type your name to sign/i;

async function openSignForm(page: import("playwright/test").Page, role: string) {
  await dismissConsent(page);
  await loginAndSwitchWorkspace(page, role, F.orgId);
  await page.goto(url);
  // The pending approval renders the sign form for any org member who can read
  // it (org-scoped) — the gate is the ACTION, not the view.
  await expect(page.locator('input[name="signedLabel"]')).toBeVisible({ timeout: 15_000 });
}

test.describe("Portal proposal sign-off — proposals:approve boundary (C2)", () => {
  test("client passes the capability gate (falls through to name validation, no sign)", async ({ page }) => {
    await openSignForm(page, "client");
    await page.locator('input[name="signedLabel"]').fill(WHITESPACE_NAME);
    await page.getByRole("button", { name: /sign approval/i }).click();
    await expect(page.getByText(NAME_REQUIRED), "client reached the name check — passed the gate").toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(DENIED), "client is NOT denied").toHaveCount(0);
  });

  test("viewer (secondary signer) also passes the capability gate", async ({ page }) => {
    await openSignForm(page, "viewer");
    await page.locator('input[name="signedLabel"]').fill(WHITESPACE_NAME);
    await page.getByRole("button", { name: /sign approval/i }).click();
    await expect(page.getByText(NAME_REQUIRED), "viewer reached the name check — passed the gate").toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(DENIED)).toHaveCount(0);
  });

  test("a non-client org member (crew) is DENIED at the sign action", async ({ page }) => {
    await openSignForm(page, "crew");
    await page.locator('input[name="signedLabel"]').fill(WHITESPACE_NAME);
    await page.getByRole("button", { name: /sign approval/i }).click();
    // Capability check fires before the name check — crew lacks proposals:approve.
    await expect(page.getByText(DENIED), "crew is refused the legally-binding sign-off").toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(NAME_REQUIRED), "crew never reaches the name check").toHaveCount(0);
  });
});
