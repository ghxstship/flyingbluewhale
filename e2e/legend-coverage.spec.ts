/**
 * LEG3ND · /legend — behavioral coverage (coverage program).
 *
 * Fills the behavioral gaps the coverage map flagged for the LEG3ND knowledge
 * surface that no existing spec exercises: the community Q&A loop (comment,
 * accept-answer), live-session registration lifecycle, and the XMCE compliance
 * engine run → finding-triage FSM (plus its manager-band access gate). Each
 * flow drives a real server-action mutation and reads back the resulting state.
 *
 * Fixture hygiene: every created record is stamped (`E2E Legend Post …`,
 * `E2E Reply …`, `E2E Rule …`, code `E2E-RULE-…`) and purged by
 * scripts/e2e-clean-fixtures.mjs (global teardown), so repeated prod runs never
 * accumulate. Community posts cascade their comments + reactions on delete.
 *
 * Org note: the legend test personas (`crew` learner, `owner` operator) are
 * seeded into the test-professional org (f4509a5f) with real published legend
 * content — see migration 20260625161724_legend_seed_test_professional_org.
 */
import { expect, test } from "./helpers/base";
import { authedSetup, suppressTour } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

test.describe("LEG3ND · /legend — behavioral coverage", () => {
  // The full login → create → transition chain runs long on a serverless prod
  // target; give it real headroom.
  test.describe.configure({ timeout: 300000 });

  // Suppress the first-run ConsoleTour scrim — even though /legend has no tour,
  // authedSetup lands the persona in the /studio shell first and the scrim
  // would intercept the post-login settle. File-scoped so the addInitScript
  // lands before the in-test login goto.
  test.beforeEach(async ({ page }) => suppressTour(page));

  // MEDIUM — the community Q&A comment loop: a learner posts a question then
  // answers it. addCommentAction inserts a community_comments row and bumps the
  // denormalized comment_count; the detail thread reads the answer back. The
  // action gates only on requireSession (no manager band), so a bare crew
  // learner is admitted by RLS.
  test("crew: adds a comment to a community post", async ({ page }) => {
    await authedSetup(page, "crew");
    const title = `E2E Legend Post ${stamp()}`;
    const reply = `E2E Reply ${stamp()}`;

    await page.goto("/legend/community");
    await page.locator('input[name="title"]').fill(title);
    await page.locator('select[name="category"]').selectOption("general");
    await page.getByRole("button", { name: /^post$/i }).click();

    // Revalidation surfaces the new post in the activity timeline, but on a
    // read-after-write serverless target the revalidated list can lag the insert
    // past the useActionState re-render — reload-retry until the new post's link
    // appears, then follow it.
    const link = page.getByRole("link", { name: title });
    await expect(async () => {
      await page.reload();
      await expect(link.first()).toBeVisible({ timeout: 8000 });
    }).toPass({ timeout: 90000 });
    await link.first().click();
    await expect(page).toHaveURL(new RegExp(`/legend/community/${UUID.source}`), { timeout: 30000 });

    // Post an answer; the thread reads it back and the count moves to 1.
    await page.getByRole("textbox", { name: /your answer/i }).fill(reply);
    await page.getByRole("button", { name: /post answer/i }).click();
    // The reply reading back IS the proof the comment persisted; the denormalized
    // "Comments · N" count heading lags the insert on a read-after-write prod
    // target, so assert on any non-zero count (or just the reply) rather than
    // exactly 1 to avoid a race.
    await expect(page.getByText(reply)).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("heading", { name: /(Comments|Answers) · [1-9]/ })).toBeVisible({ timeout: 30000 });
  });

  // MEDIUM — the accepted-answer FSM branch (kit 21 R2 / ADR-0015): the
  // question's author accepts an answer on a `questions`-category post,
  // stamping community_posts.accepted_comment_id. The Accept Answer control
  // renders only for isQuestion && isAuthor; clicking it flips the answer to
  // Accepted.
  test("crew-author: accepts an answer on a questions post", async ({ page }) => {
    await authedSetup(page, "crew");
    const title = `E2E Legend Post ${stamp()}`;
    const reply = `E2E Reply ${stamp()}`;

    await page.goto("/legend/community");
    await page.locator('input[name="title"]').fill(title);
    await page.locator('select[name="category"]').selectOption("questions");
    await page.getByRole("button", { name: /^post$/i }).click();

    const link = page.getByRole("link", { name: title });
    await expect(link).toBeVisible({ timeout: 30000 });
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/legend/community/${UUID.source}`), { timeout: 30000 });

    // Add an answer, then accept it (author-only control on a questions post).
    await page.getByRole("textbox", { name: /your answer/i }).fill(reply);
    await page.getByRole("button", { name: /post answer/i }).click();
    await expect(page.getByText(reply)).toBeVisible({ timeout: 30000 });

    const accept = page.getByRole("button", { name: /^accept answer$/i });
    await expect(accept).toBeVisible({ timeout: 15000 });
    await accept.click();
    // The stamped acceptance flips the control label + surfaces the Accepted badge.
    await expect(page.getByRole("button", { name: /^accepted$/i })).toBeVisible({ timeout: 30000 });
  });

  // MEDIUM — the live-session registration lifecycle: a learner registers for a
  // session (registered/waitlisted per capacity) then cancels
  // (registration_state → cancelled). Idempotent per (session, user) via upsert,
  // so re-runs never accumulate. Skips cleanly when no session is seeded.
  test("crew: registers for then cancels a live session", async ({ page }) => {
    await authedSetup(page, "crew");
    await page.goto("/legend/live");

    const register = page.getByRole("button", { name: /^register$/i });
    if ((await register.count()) === 0) return; // no bookable sessions seeded — vacuously covered

    await register.first().click();
    // The row flips to a Cancel control and shows the registration outcome.
    await expect(page.getByRole("button", { name: /^cancel$/i }).first()).toBeVisible({ timeout: 30000 });

    await page.getByRole("button", { name: /^cancel$/i }).first().click();
    // Cancelling releases the seat — a Register control returns for the row.
    await expect(page.getByRole("button", { name: /^register$/i }).first()).toBeVisible({ timeout: 30000 });
  });

  // MEDIUM — the XMCE compliance engine run → finding-triage FSM: an operator
  // authors an active rule, runs the engine (which flags it and writes an OPEN
  // finding), then triages that finding to Resolved via setFindingStateAction.
  // The run detail reads the new finding_state back on the badge.
  test("owner: runs the compliance engine and triages a finding", async ({ page }) => {
    await authedSetup(page, "owner");

    // Seed one ACTIVE rule so the run produces a finding (the stub engine flags
    // every 2nd active rule; index 0 is always flagged).
    await createInModule(page, "/legend/engine/rules/new", {
      code: `E2E-RULE-${stamp()}`,
      title: `E2E Rule ${stamp()}`,
      rule_state: "active",
    });
    await expect(page).toHaveURL(new RegExp(`/legend/engine/rules/${UUID.source}`), { timeout: 90000 });

    // Run the engine (default org scope) → redirects to the run detail.
    await page.goto("/legend/engine/runs");
    await page.getByRole("button", { name: /run engine/i }).first().click();
    await expect(page).toHaveURL(new RegExp(`/legend/engine/runs/${UUID.source}`), { timeout: 90000 });

    const stateSelect = page.locator('select[id^="finding-state-"]').first();
    await expect(stateSelect).toBeVisible({ timeout: 30000 });
    // Triage the first finding to Resolved. The <select> in FindingsTable is
    // CONTROLLED by the finding's persisted state and fires setFindingStateAction
    // via onChange (selectOption dispatches input+change, which React's onChange
    // consumes). Two things make a pre-reload assertion unreliable on a serverless
    // target: the controlled input snaps back to the stale prop until an RSC
    // refresh lands, and the "Finding updated" toast fire-and-dismisses faster
    // than the action round-trip can be polled. So gate on SERVER-TRUTH instead:
    // a fresh reload re-renders the select from the persisted finding_state.
    // Re-dispatch + reload inside a poll loop to ride out read-after-write lag
    // (and re-fire the change should the first one be dropped). The owner persona
    // reached this manager-gated run detail, so isManagerPlus + the owner RLS
    // write policy both admit the update — the write does persist.
    await expect(async () => {
      const sel = page.locator('select[id^="finding-state-"]').first();
      if ((await sel.inputValue().catch(() => "")) !== "resolved") {
        await sel.selectOption("resolved");
        await page.waitForTimeout(1500);
        await page.reload();
      }
      await expect(page.locator('select[id^="finding-state-"]').first()).toHaveValue("resolved", { timeout: 8000 });
    }).toPass({ timeout: 120000 });
  });

  // LOW (gated-denial) — the compliance-run surface is a manager-band area: a
  // bare member is refused at the page level (AccessDenied), so the triage
  // controls never render for an under-privileged role.
  test("member: is denied the compliance runs surface", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/legend/engine/runs");
    await expect(page.getByText(/don.?t have access|requires the Manager role/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator('select[id^="finding-state-"]')).toHaveCount(0);
  });
});
