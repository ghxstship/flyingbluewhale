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
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

type Pg = import("playwright/test").Page;

/** The /me/organizations membership rows are direct children of the surface. */
const orgRow = (page: Pg) => page.locator(".surface > div").filter({ hasText: TARGET_ORG });

/** Sign in as the admin and pin the active workspace to the target org. */
async function adminInTargetOrg(page: Pg) {
  await authedSetup(page, "admin");
  const pin = await page.request.patch("/api/v1/me/workspaces", { data: { orgId: TEST_ORGS.starter } });
  expect(pin.ok(), "workspace pin to the Starter org failed — reseed fixtures").toBeTruthy();
}

/**
 * Admin re-invites the viewer into the target org and returns the accept URL.
 * `member` is the fixture's ACTUAL role there (the email suffix is not the DB
 * role) and one of the three the form offers (admin|manager|member — no
 * `viewer`). Matching it matters: accept_invite upserts with the INVITE's role,
 * so any other level would rewrite the fixture's role while still passing.
 */
async function reinvite(page: Pg): Promise<string> {
  await page.goto("/studio/people/invites");
  await page.locator('main [name="email"]').first().fill(VIEWER_EMAIL);
  await page.locator('main select[name="role"]').first().selectOption("member");
  await page
    .locator("main form")
    .first()
    .evaluate((f: HTMLFormElement) => f.requestSubmit());

  const inviteRow = page.locator("tr").filter({ hasText: VIEWER_EMAIL }).first();
  await expect(inviteRow, "the pending invite row appears").toBeVisible({ timeout: 60000 });
  // "Copy Link" writes the accept URL to the CLIPBOARD (deliberately not an
  // <a href>, so an admin can't navigate into the invitee's flow).
  await inviteRow.getByRole("button", { name: /copy link/i }).click();
  const acceptUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(acceptUrl, "the copied link is an accept-invite URL").toContain("/accept-invite/");
  return acceptUrl;
}

/** The viewer redeems the token, then we assert server truth: the membership is
 *  back in their own list (accept_invite cleared the deleted_at). */
async function acceptAndAssertRestored(page: Pg, acceptUrl: string) {
  await authedSetup(page, "viewer");
  await page.goto(acceptUrl);
  await page.getByRole("button", { name: /accept/i }).first().click();
  await expect(async () => {
    await page.goto("/me/organizations");
    await expect(orgRow(page).first()).toBeVisible({ timeout: 8000 });
  }).toPass({ timeout: 120000 });
}

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
    await adminInTargetOrg(page);
    const acceptUrl = await reinvite(page);

    // ── 3+4. ACCEPT → the membership is restored (server truth) ──────────────
    await acceptAndAssertRestored(page, acceptUrl);
  });

  // The ADMIN-driven offboard — `removePerson`, the most thorough server action
  // in the repo (soft-delete + a five-table cascade + audit) and, per the 2026-07
  // audit, entirely untested. This drives it for real and asserts the thing that
  // actually matters: the removed member's ACCESS DIES (every session /
  // api-key / workspace-switch path filters `deleted_at IS NULL`).
  test("admin removes a member, their access dies, and a re-invite restores it", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // ── 0. Resolve the member's user id from their OWN session ───────────────
    // Not via the roster search: that column's accessor is `name ?? email`, so
    // an email search silently matches nothing for anyone who has a name.
    await authedSetup(page, "viewer");
    const meRes = await page.request.get("/api/v1/me");
    expect(meRes.ok(), "/api/v1/me resolves the member's session").toBeTruthy();
    const viewerId = ((await meRes.json()) as { data: { userId: string } }).data.userId;
    expect(viewerId).toMatch(UUID);

    // ── 1. ADMIN removes the member from the org ─────────────────────────────
    await adminInTargetOrg(page);
    await page.goto(`/studio/people/${viewerId}`);
    await expect(page).toHaveURL(new RegExp(`/studio/people/${UUID.source}`), { timeout: 30000 });

    // DeleteForm → confirm. removePerson soft-deletes the membership and
    // cascades project_members / api_keys / AM assignments / chat rooms / push.
    await page.getByRole("button", { name: /^(remove|delete)/i }).first().click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /^(remove|delete|confirm)/i })
      .first()
      .click()
      .catch(async () => {
        // Some DeleteForm variants confirm inline rather than in a dialog.
        await page.getByRole("button", { name: /^(remove|delete|confirm)/i }).nth(1).click();
      });

    // ── 2. ACCESS DIES: the org vanishes from the removed member's own list ──
    await authedSetup(page, "viewer");
    await expect(async () => {
      await page.goto("/me/organizations");
      await expect(orgRow(page)).toHaveCount(0, { timeout: 8000 });
    }).toPass({ timeout: 120000 });

    // ── 3. RE-INVITE + ACCEPT restores them (leaves the fixture as found) ────
    await adminInTargetOrg(page);
    const acceptUrl = await reinvite(page);
    await acceptAndAssertRestored(page, acceptUrl);
  });
});
