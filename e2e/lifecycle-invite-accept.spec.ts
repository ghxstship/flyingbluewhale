/**
 * LIFECYCLE — the membership round-trip: leave an org → get re-invited →
 * accept → membership restored.
 *
 * Closes the #1 gap the 2026-07 lifecycle audit found: the invite ACCEPT loop
 * (accept_invite RPC → membership upsert, restoring `deleted_at`) was never
 * exercised end-to-end — only the garbage-token failure path was. It also
 * covers the self-departure `leaveOrgAction` (new) and the admin invite-create
 * + copy-link path in one honest chain.
 *
 * Why this shape: every seeded fixture user already belongs to all four test
 * orgs, so an accept would be a no-op upsert and prove nothing. Leaving FIRST
 * makes the accept do real work — it must restore a soft-deleted membership,
 * which is exactly the branch that ships untested.
 *
 * Self-healing: the accept puts the viewer back where they started, so the
 * chain is idempotent. If it fails mid-way the viewer is stranded OUT of the
 * org, so scripts/e2e-clean-fixtures.mjs (global teardown) restores the
 * membership — the same self-heal pattern as the marketplace talent fixture.
 *
 * Target: the viewer fixture + Starter org — the lowest-stakes pairing (viewer
 * is never an owner, so the last-owner guard can't trip, and no other spec
 * depends on viewer's Starter membership).
 */
import { expect, test } from "./helpers/base";
import { authedSetup, suppressTour, fixtureEmail } from "./helpers/auth";
import { TEST_ORGS } from "./helpers/fixtures";

const VIEWER_EMAIL = fixtureEmail("viewer");
const TARGET_ORG = "Test Starter Org";

/** The /me/organizations membership rows are direct children of the surface. */
const orgRow = (page: import("playwright/test").Page) =>
  page.locator(".surface > div").filter({ hasText: TARGET_ORG });

test.describe("Lifecycle — leave org, re-invite, accept, restore", () => {
  // login → leave → switch-org → invite → accept → verify runs long on prod.
  test.describe.configure({ timeout: 300000 });
  test.beforeEach(async ({ page }) => suppressTour(page));

  test("viewer leaves an org, admin re-invites, viewer accepts and is restored", async ({ page, context }) => {
    // The admin "Copy Link" control writes the accept URL to the clipboard
    // (it is deliberately NOT an <a href>, so the admin can't navigate into
    // the invitee's flow) — read it back to drive the real path.
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // ── 1. SELF-DEPARTURE: the viewer leaves the org ─────────────────────────
    await authedSetup(page, "viewer");
    await page.goto("/me/organizations");
    const row = orgRow(page).first();
    await expect(row, `${TARGET_ORG} membership present before the round-trip`).toBeVisible({ timeout: 30000 });
    await row.getByRole("button", { name: /^leave$/i }).click();
    await row.getByRole("button", { name: /confirm leave/i }).click();
    // The membership is soft-deleted + cascaded; the row drops on refresh.
    await expect(orgRow(page), "the org is gone after leaving").toHaveCount(0, { timeout: 60000 });

    // ── 2. ADMIN re-invites them into that same org ──────────────────────────
    await authedSetup(page, "admin");
    const pin = await page.request.patch("/api/v1/me/workspaces", { data: { orgId: TEST_ORGS.starter } });
    expect(pin.ok(), "workspace pin to the Starter org failed — reseed fixtures").toBeTruthy();

    await page.goto("/studio/people/invites");
    await page.locator('main [name="email"]').first().fill(VIEWER_EMAIL);
    // `member` is this fixture's ACTUAL role in the Starter org (the email
    // suffix is not the DB role) AND one of the three roles the invite form
    // offers (admin|manager|member — there is no `viewer` option). Matching it
    // matters: accept_invite upserts the membership with the INVITE's role, so
    // inviting at any other level would rewrite the fixture's role instead of
    // restoring it, and the round-trip would stop being self-healing.
    await page.locator('main select[name="role"]').first().selectOption("member");
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());

    // The pending invite lands in the table; copy its accept link.
    const inviteRow = page.locator("tr").filter({ hasText: VIEWER_EMAIL }).first();
    await expect(inviteRow, "the pending invite row appears").toBeVisible({ timeout: 60000 });
    await inviteRow.getByRole("button", { name: /copy link/i }).click();
    const acceptUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(acceptUrl, "the copied link is an accept-invite URL").toContain("/accept-invite/");

    // ── 3. ACCEPT: the invitee redeems the token ─────────────────────────────
    await authedSetup(page, "viewer");
    await page.goto(acceptUrl);
    await page.getByRole("button", { name: /accept/i }).first().click();

    // ── 4. SERVER TRUTH: the membership is restored ──────────────────────────
    // accept_invite upserts the membership, clearing the deleted_at the leave
    // stamped — the org is back in the viewer's own list.
    await expect(async () => {
      await page.goto("/me/organizations");
      await expect(orgRow(page).first()).toBeVisible({ timeout: 8000 });
    }).toPass({ timeout: 120000 });
  });
});
