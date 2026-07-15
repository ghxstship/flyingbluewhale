/**
 * ATLVS · Governance, Comms & Advancing-merge — behavioral coverage
 * (coverage program wave).
 *
 * Fills the behavioral gaps the coverage map flagged for the governance /
 * comms cluster that no existing deep/persona spec exercises. Each flow
 * drives a real mutation (create → transition/edit, or an app-layer gate
 * denial) as the entitled — or intentionally under-privileged — persona.
 *
 * Fixture hygiene: every record this file creates is stamped
 * `E2E <Thing> <ts>` (policy / delegation / committee / gov-policy /
 * announcement / poll / survey / channel / channel-message, plus the
 * `E2E PO Decide` purchase order the decision flow routes) so
 * scripts/e2e-clean-fixtures.mjs (global teardown) purges it and repeated
 * prod runs never accumulate. Child rows (approval_steps, poll_options,
 * survey_questions, messages-in-my-channel) ON DELETE CASCADE from their
 * stamped parent, so only the parents need teardown targets. The
 * approval_instances row the decision flow opens has NO FK back to the PO —
 * teardown purges it on its metadata title (see purgeApprovalInstances).
 */
import { expect, test } from "./helpers/base";
import { authedSetup, suppressTour } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

// Resolve the first REAL record detail link under a list route (a UUID child,
// never the "+ New" sibling which also matches the `/studio/<module>/` prefix).
async function firstRecordLink(page: import("playwright/test").Page, listRoute: string) {
  const links = page.locator(`a[href^="${listRoute}/"]`);
  const n = await links.count();
  for (let i = 0; i < n; i++) {
    const href = await links.nth(i).getAttribute("href");
    if (href && UUID.test(href)) return links.nth(i);
  }
  return null;
}

test.describe("ATLVS Governance, Comms & Advancing-merge — behavioral coverage", () => {
  // The full login → create (cold-start) → transition chain runs long on a
  // serverless prod target; give it real headroom.
  test.describe.configure({ timeout: 300000 });

  // Suppress the first-run ConsoleTour scrim (z-tour, full-viewport) — it
  // intercepts clicks on the /studio shell and hangs every action button.
  // File-scoped so the addInitScript lands before the in-test login goto.
  test.beforeEach(async ({ page }) => suppressTour(page));

  // ── Governance · Approvals engine ──────────────────────────────────────

  // HIGH + MEDIUM — create an approval policy (lands on the policy detail),
  // then build it out by adding a routing step.
  //
  // Persona is ADMIN, not manager: the app-layer gate is isManagerPlus, but
  // the row-security on both `approval_policies` (uas_pol_org) AND
  // `approval_steps` (uas_step_org) is is_org_admin — a manager passes the app
  // gate, then the INSERT is RLS-rejected → createInModule would hang on /new.
  test("admin: create an approval policy, then add a routing step", async ({ page }) => {
    await authedSetup(page, "admin");
    const s = stamp();
    await createInModule(page, "/studio/governance/approvals/policies/new", {
      name: `E2E Policy ${s}`,
      slug: `e2e-policy-${s}`,
      applies_to: "expenses",
    });
    // Landed on the materialised policy detail.
    await expect(page).toHaveURL(new RegExp(`/studio/governance/approvals/policies/${UUID.source}`), {
      timeout: 90000,
    });

    // The detail carries an inline "Add a step" form (step_number defaults to
    // 1, routing_kind defaults to sequential). Its submit label resolves from
    // t("common.add") → "Add" (the "Add step" arg is only a missing-key
    // fallback), so match the real button text. Submit and assert the new step
    // surfaces in the Steps list.
    await page.locator("main").getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText("#1", { exact: true })).toBeVisible({ timeout: 30000 });
  });

  // MEDIUM — create an approval delegation → redirect back to the delegations
  // list. scope_ref carries the stamp so teardown can purge it.
  //
  // Persona is ADMIN: `approval_delegations` row-security (uas_del_self) only
  // admits the INSERT when delegator_party_id is one of the caller's
  // parties.id OR is_org_admin. createDelegation writes session.userId (the
  // auth uid, NOT a parties.id) as delegator_party_id, so the sole passing
  // path is the is_org_admin branch — a manager's INSERT is RLS-rejected.
  test("admin: create an approval delegation", async ({ page }) => {
    await authedSetup(page, "admin");
    await createInModule(page, "/studio/governance/approvals/delegations/new", {
      scope_ref: `E2E Delegation ${stamp()}`,
    });
    await expect(page).toHaveURL(/\/studio\/governance\/approvals\/delegations$/, { timeout: 90000 });
  });

  // HIGH — the OTHER half of the approvals engine: recording a decision on an
  // open instance and advancing its state. Chain: manager creates a PO → routes
  // it (opens an instance seeded at the fixture policy's step #1) → approves it
  // on the governance detail.
  //
  // Proves both halves of 20260715130000_approvals_decision_rls.sql, each with
  // its own assertion below:
  //   · approval_decisions INSERT — uas_dec_decider admitted ONLY a parties.id
  //     while recordDecision writes the auth uid, so NO persona could record a
  //     decision (a parties.id never equals an auth uid).
  //   · approval_instances UPDATE — no policy existed, so the state advance was
  //     RLS-denied and silently swallowed: the instance stayed open forever.
  // Persona is MANAGER (not admin like the policy-authoring tests above): the
  // decision path is isManagerPlus-gated and now RLS-matches that band.
  test("manager: record a decision on a routed approval, advancing its state", async ({ page }) => {
    await authedSetup(page, "manager");

    // Open an instance: a draft PO routed against the seeded purchase_orders policy.
    await createInModule(page, "/studio/procurement/purchase-orders/new", {
      title: `E2E PO Decide ${stamp()}`,
      amount: "3200",
    });
    await expect(page).toHaveURL(new RegExp(`/studio/procurement/purchase-orders/${UUID.source}`), { timeout: 90000 });
    await page.getByRole("button", { name: /route to approvals/i }).click();
    await expect(page).toHaveURL(new RegExp(`/studio/governance/approvals/${UUID.source}`), { timeout: 90000 });

    // The instance is open at step #1, so "Record a decision" renders.
    const decisionForm = page.locator("main form").filter({ has: page.locator('select[name="decision"]') });
    await expect(decisionForm).toBeVisible({ timeout: 30000 });
    await decisionForm.locator('select[name="decision"]').selectOption("approved");
    await decisionForm.locator('textarea[name="notes"]').fill(`E2E Decision ${stamp()}`);
    await decisionForm.evaluate((f: HTMLFormElement) => f.requestSubmit());

    // No error surface: recordDecision now RETURNS the state-advance failure
    // instead of swallowing it, so a regression on either policy lands here.
    await expect(page.getByRole("alert").filter({ hasText: /failed|error|violates/i })).toHaveCount(0, {
      timeout: 30000,
    });
    // The decision row landed → approval_decisions INSERT passed.
    await expect(page.getByText(/no decisions recorded yet/i)).toHaveCount(0, { timeout: 30000 });
    // The instance closed (state=approved ⇒ `open` false ⇒ the form unmounts) →
    // approval_instances UPDATE passed. A silent no-op would leave it rendered.
    await expect(decisionForm).toHaveCount(0, { timeout: 30000 });
  });

  // MEDIUM — the app manager+ gate on policy authoring is honored for a
  // member: createPolicy returns the explicit denial before it ever parses.
  test("member: approval policy create is refused (manager+ gated)", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/studio/governance/approvals/policies/new");
    const s = stamp();
    await page.locator('main [name="name"]').fill(`E2E Policy ${s}`);
    await page.locator('main [name="slug"]').fill(`e2e-policy-${s}`);
    await page.locator('main [name="applies_to"]').fill("expenses");
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    // FormShell echoes the error into BOTH the visible Alert AND a sr-only
    // role="alert" live region — `.first()` avoids the strict-mode 2-match.
    await expect(page.getByText(/only manager\+ can create approval policies/i).first()).toBeVisible({
      timeout: 30000,
    });
  });

  // ── Governance · Settings (committees & policies) ──────────────────────

  // MEDIUM + LOW — an admin seeds a governance committee AND a governance
  // policy through the settings dialogs; both rows land in their tables.
  test("admin: create a governance committee and a governance policy", async ({ page }) => {
    await authedSetup(page, "admin");
    await page.goto("/studio/settings/governance");

    const committee = `E2E Committee ${stamp()}`;
    await page.getByRole("button", { name: /\+ committee/i }).click();
    const cDialog = page.getByRole("dialog");
    await cDialog.locator('input[name="name"]').fill(committee);
    await cDialog.getByRole("button", { name: /^create$/i }).click();
    await expect(page.getByText(committee)).toBeVisible({ timeout: 30000 });

    // The committee dialog does NOT auto-close on success (useActionState
    // returns null→null, so the close effect never re-fires) — its modal
    // overlay would swallow the "+ Policy" click. Dismiss it first.
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 10000 });

    const policy = `E2E GovPolicy ${stamp()}`;
    await page.getByRole("button", { name: /\+ policy/i }).click();
    const pDialog = page.getByRole("dialog");
    await pDialog.locator('input[name="name"]').fill(policy);
    await pDialog.getByRole("button", { name: /^create$/i }).click();
    await expect(page.getByText(policy)).toBeVisible({ timeout: 30000 });
  });

  // LOW — a non-admin manager is blocked from the governance settings surface.
  // /studio/settings/governance is admin-band (settingsNav minRole "admin"),
  // so SettingsLayout renders <AccessDenied requiredRole="Admin"> in place of
  // the page for a manager — the CommitteeForm (and its app-layer isAdmin gate)
  // is unreachable. Assert the layout denial, not the in-dialog error.
  test("manager: governance settings is admin-gated (no committee authoring)", async ({ page }) => {
    await authedSetup(page, "manager");
    await page.goto("/studio/settings/governance");
    await expect(page.getByText(/requires the admin role/i)).toBeVisible({ timeout: 30000 });
    // The composer never mounts behind the denial.
    await expect(page.getByRole("button", { name: /\+ committee/i })).toHaveCount(0);
  });

  // ── Comms · Announcements ──────────────────────────────────────────────

  // MEDIUM + MEDIUM — create a draft announcement, edit its title, then
  // archive it (publish_state → archived). Covers the edit + archive gaps.
  test("manager: create an announcement, edit it, then archive it", async ({ page }) => {
    await authedSetup(page, "manager");
    const title = `E2E Announcement ${stamp()}`;
    await createInModule(page, "/studio/comms/announcements/new", { title });
    await expect(page).toHaveURL(new RegExp(`/studio/comms/announcements/${UUID.source}`), { timeout: 90000 });

    // Edit the title via the detail → edit form (FormShell → redirect back).
    await page.getByRole("link", { name: /^edit$/i }).click();
    await expect(page).toHaveURL(/\/edit$/, { timeout: 30000 });
    await page.locator('main [name="title"]').fill(`${title} Edited`);
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/studio/comms/announcements/${UUID.source}$`), { timeout: 90000 });

    // Archive (a plain server-action form; the button vanishes once archived).
    await page.getByRole("button", { name: /^archive$/i }).click();
    await expect(page.getByRole("button", { name: /^archive$/i })).toHaveCount(0, { timeout: 30000 });
    await expect(page.getByText("archived", { exact: true })).toBeVisible({ timeout: 30000 });
  });

  // MEDIUM — a member cannot broadcast an announcement (manager+ gate fires
  // before the insert).
  test("member: announcement create is refused (manager+ gated)", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/studio/comms/announcements/new");
    await page.locator('main [name="title"]').fill(`E2E Announcement ${stamp()}`);
    await page.locator('main [name="body"]').fill("E2E body");
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page.getByText(/only manager\+ can publish announcements/i).first()).toBeVisible({ timeout: 30000 });
  });

  // ── Comms · Polls ──────────────────────────────────────────────────────

  // MEDIUM — create a live poll (go-live is the default) then close it from
  // the detail (publish_state live → closed).
  test("manager: create a live poll, then close it", async ({ page }) => {
    await authedSetup(page, "manager");
    await createInModule(page, "/studio/comms/polls/new", {
      question: `E2E Poll ${stamp()}`,
      options: "Yes\nNo",
    });
    await expect(page).toHaveURL(new RegExp(`/studio/comms/polls/${UUID.source}`), { timeout: 90000 });

    await page.getByRole("button", { name: /close poll/i }).click();
    await expect(page.getByRole("button", { name: /close poll/i })).toHaveCount(0, { timeout: 30000 });
    await expect(page.getByText("closed", { exact: true })).toBeVisible({ timeout: 30000 });
  });

  // LOW — member is blocked from poll creation (manager+ gate).
  test("member: poll create is refused (manager+ gated)", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/studio/comms/polls/new");
    await page.locator('main [name="question"]').fill(`E2E Poll ${stamp()}`);
    await page.locator('main [name="options"]').fill("Yes\nNo");
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page.getByText(/only manager\+ can publish polls/i).first()).toBeVisible({ timeout: 30000 });
  });

  // ── Comms · Surveys ────────────────────────────────────────────────────

  // HIGH + MEDIUM — create a draft survey, add a question via the detail
  // composer, then run the publish → close lifecycle.
  test("manager: create a survey, add a question, publish then close", async ({ page }) => {
    await authedSetup(page, "manager");
    await createInModule(page, "/studio/comms/surveys/new", { title: `E2E Survey ${stamp()}` });
    await expect(page).toHaveURL(new RegExp(`/studio/comms/surveys/${UUID.source}`), { timeout: 90000 });

    // Add a question (the composer only renders while the survey is draft).
    const prompt = `E2E Question ${stamp()}`;
    await page.locator('form [name="prompt"]').fill(prompt);
    await page.getByRole("button", { name: /add question/i }).click();
    await expect(page.getByText(prompt)).toBeVisible({ timeout: 30000 });

    // Publish → then Close.
    await page.getByRole("button", { name: /^publish$/i }).click();
    await expect(page.getByRole("button", { name: /^close$/i })).toBeVisible({ timeout: 30000 });
    await page.getByRole("button", { name: /^close$/i }).click();
    await expect(page.getByText("closed", { exact: true })).toBeVisible({ timeout: 30000 });
  });

  // LOW — member is blocked from survey creation (manager+ gate).
  test("member: survey create is refused (manager+ gated)", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/studio/comms/surveys/new");
    await page.locator('main [name="title"]').fill(`E2E Survey ${stamp()}`);
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page.getByText(/only manager\+ can publish surveys/i).first()).toBeVisible({ timeout: 30000 });
  });

  // ── Comms · Channels ───────────────────────────────────────────────────

  // MEDIUM — create a message channel under the Channel Plan → redirect to
  // the channel detail.
  //
  // Persona is MANAGER: the app-layer gate is isManagerPlus and migration
  // 20260714130000_message_channels_write_rls added the matching INSERT policy
  // (ums_ch_insert, with-check is_org_manager_plus) plus extended the SELECT
  // carve-out (ums_ch_member) from admin-only to manager+ so the insert's
  // RETURNING and the detail read resolve for a plain manager.
  test("manager: create a message channel", async ({ page }) => {
    await authedSetup(page, "manager");
    await createInModule(page, "/studio/comms/channels/new", { name: `E2E Channel ${stamp()}` });
    await expect(page).toHaveURL(new RegExp(`/studio/comms/channels/${UUID.source}`), { timeout: 90000 });
  });

  // LOW — posting into a channel is any-member (postMessage only
  // requireSession-gates). A member opens the first visible channel and posts.
  test("member: post a message into a channel", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/studio/comms/channels");
    const channel = await firstRecordLink(page, "/studio/comms/channels");
    if (!channel) return; // no channel visible to this member — nothing to post into
    await channel.click();
    await expect(page).toHaveURL(new RegExp(`/studio/comms/channels/${UUID.source}`), { timeout: 30000 });

    const body = `E2E Channel Msg ${stamp()}`;
    await page.locator('main [name="body_markdown"]').fill(body);
    await page.getByRole("button", { name: /^post$/i }).click();
    await expect(page.getByText(body)).toBeVisible({ timeout: 30000 });
  });

  // ── Advancing · Merge engine (kit 27) ──────────────────────────────────

  // MEDIUM — a member is blocked from the advancing-preset surface.
  // /studio/settings/advancing is manager-band (settingsNav minRole "manager"),
  // so SettingsLayout renders <AccessDenied requiredRole="Manager"> in place of
  // the page for a bare member — the preset composer (and addPresetAction's
  // manager+ app-gate) is unreachable. Assert the layout denial.
  test("member: advancing presets is manager-gated (no preset authoring)", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/studio/settings/advancing");
    await expect(page.getByText(/requires the manager role/i)).toBeVisible({ timeout: 30000 });
    // The composer never mounts behind the denial.
    await expect(page.getByRole("button", { name: /save preset/i })).toHaveCount(0);
  });
});
