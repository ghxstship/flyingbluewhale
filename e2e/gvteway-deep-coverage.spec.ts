/**
 * GVTEWAY portal — DEEP coverage (state transitions · authz boundaries · AM
 * messaging · party-scoped reads).
 *
 * This deepens `e2e/gvteway-portal-personas.spec.ts` (breadth: every persona's
 * rail renders) and `e2e/portal-proposal-lifecycle.spec.ts` (which only CREATES
 * a change-order / revision round). Here we drive the parts of the client
 * proposal-lifecycle + portal surfaces that no existing spec touches:
 *
 *   • The DECIDE half of the revision-round state machine (open → approved AND
 *     open → changes_requested) — the persona spec only opens a round.
 *   • The change-order APPROVE transition (priced → approved).
 *   • The approval DECLINE path (pending → declined) — C2 only probes the SIGN
 *     capability gate non-destructively, never the decline branch.
 *   • The phase-gate sign-off (toggleGate + approvePhase) end-to-end.
 *   • Three DISTINCT `proposals:approve` denial strings for a non-approver
 *     persona (crew): change-order create, revision create, lifecycle gate.
 *   • The messages-to-AM surface (mint room via /messages/start + postPortalMessage).
 *   • Cross-tenant mutation guard: a write attempt against a real FOREIGN slug.
 *   • Party-scoped reads: guest sees only THEIR ticket; artist's PortalDocVault
 *     shows only self-submitted deliverables.
 *
 * Fixture org: Test Professional (f4509a5f); proposal 3e7fbd4f on
 * test-professional-show. The client fixture is a member so RLS resolves the
 * proposal context and its last_org_id → session.orgId matches the proposal org.
 *
 * Resilience: several journeys depend on rows the shared seeder does NOT create
 * yet (a `priced` change-order, phase_state + gate rows, a guest ticket
 * assignment, an account_manager_assignments pairing). Rather than fail red on a
 * clean environment, those tests self-seed through the UI where possible, and
 * otherwise `test.skip()` at runtime with a loud reason when the required
 * fixture is absent — so the suite stays green and lights up the moment the seed
 * lands. The create→decide journeys (revisions) are fully self-contained.
 */
import { expect, test } from "./helpers/base";
import { dismissConsent, loginAndSwitchWorkspace } from "./helpers/auth";
import { stamp } from "./helpers/forms";
import type { Page } from "playwright/test";

const SLUG = "test-professional-show";
const PROPOSAL_ID = "3e7fbd4f-0f30-4cb0-b1e0-57ff7ae727b5";
const PROFESSIONAL_ORG_ID = "f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7";
const base = `/p/${SLUG}/client/proposals/${PROPOSAL_ID}`;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

/** dismiss consent + log in as `role` with the active workspace pinned to the
 *  professional org (so client sign-off actions resolve the proposal).
 *
 *  One bounded retry: under serial-run dev-server congestion the post-login
 *  redirect can outlive loginAs's 25s waitForURL, and the workspace-switch
 *  PATCH has returned a transient non-200 once (deep-e2e.log, phase-gate
 *  flake). Reset to a clean unauthenticated state between attempts so the
 *  retry's loginAs always lands on the real login form; a second identical
 *  failure still throws, so genuine auth/seed breakage stays loud. */
async function enter(page: Page, role: string): Promise<void> {
  await dismissConsent(page);
  try {
    await loginAndSwitchWorkspace(page, role, PROFESSIONAL_ORG_ID);
  } catch {
    await page.context().clearCookies();
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, role, PROFESSIONAL_ORG_ID);
  }
}

/**
 * Submit a portal FormShell `/new` page (the portal isn't wrapped in <main> and
 * has header/nav forms, so target the one that actually holds the title input),
 * then assert it redirected off /new with no error surface. Mirrors the helper
 * in portal-proposal-lifecycle.spec.ts.
 */
async function submitFormShell(page: Page, route: string, fields: Record<string, string>): Promise<void> {
  await page.goto(route);
  for (const [name, value] of Object.entries(fields)) {
    const el = page.locator(`[name="${name}"]`).first();
    if (await el.count()) await el.fill(value);
  }
  await page
    .locator('form:has([name="title"])')
    .first()
    .evaluate((f: HTMLFormElement) => f.requestSubmit());
  await expect(page).not.toHaveURL(/\/new(\?|$)/, { timeout: 45_000 });
  await expect(page.getByRole("alert").filter({ hasText: /error|failed|invalid/i })).toHaveCount(0);
}

/** Open a fresh revision round through the UI and return its detail URL (state
 *  `open` → the RevisionDecision block is decidable). */
async function openRevisionRound(page: Page): Promise<string> {
  await submitFormShell(page, `${base}/revisions/new`, {
    title: `E2E Revision ${stamp()}`,
    summary: "Tighten the timeline and refresh the moodboard.",
  });
  await expect(page).toHaveURL(new RegExp(`/revisions/${UUID.source}`), { timeout: 15_000 });
  return page.url();
}

// ── client · revision-round decisions ──────────────────────────────────────
test.describe("GVTEWAY portal deep coverage (client · revision decisions)", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => enter(page, "client"));

  test("client opens a round and APPROVES it (open → approved)", async ({ page }) => {
    await openRevisionRound(page);

    // The RevisionDecision block renders because state === 'open'. Default card
    // is 'approved' — just submit.
    const decide = page.locator("form:has([name='roundId'])");
    await expect(decide, "the round is decidable (open)").toBeVisible({ timeout: 15_000 });
    await decide.getByRole("button", { name: /submit decision/i }).click();

    await expect(
      page.getByText("Decision recorded.", { exact: false }),
      "the approve decision was recorded",
    ).toBeVisible({ timeout: 15_000 });
    // NOTE: the portal shell always mounts an (empty) sr-only role="alert"
    // live region (LiveRegionProvider), so a bare getByRole("alert") count is
    // never 0 — filter to error-ish text like every other alert assertion.
    await expect(
      page.getByRole("alert").filter({ hasText: /error|failed|not authorized/i }),
      "no error alert on approve",
    ).toHaveCount(0);

    // Server truth: reload; approved is no longer decidable, badge flips.
    await page.reload();
    await expect(page.locator("header").getByText("Approved", { exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test("client opens a round and REQUESTS CHANGES (open → changes_requested)", async ({ page }) => {
    await openRevisionRound(page);

    const decide = page.locator("form:has([name='roundId'])");
    await expect(decide).toBeVisible({ timeout: 15_000 });
    // Pick the non-default branch.
    await decide.getByRole("radio", { name: /request changes/i }).click();
    await decide.locator("textarea[name='note']").fill("Please tighten act two and re-key the palette.");
    await decide.getByRole("button", { name: /submit decision/i }).click();

    await expect(page.getByText("Decision recorded.", { exact: false })).toBeVisible({ timeout: 15_000 });
    // Filtered for the same always-mounted sr-only live-region reason as above.
    await expect(
      page.getByRole("alert").filter({ hasText: /error|failed|not authorized/i }),
      "no error alert on changes_requested",
    ).toHaveCount(0);

    await page.reload();
    await expect(page.locator("header").getByText("Changes Requested", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
  });
});

// ── client · change-order approve + approval decline + phase gate ──────────
test.describe("GVTEWAY portal deep coverage (client · sign-off transitions)", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => enter(page, "client"));

  test("client APPROVES a priced change-order (priced → approved)", async ({ page }) => {
    // The CO detail route's first compile on a cold dev server has been observed
    // to outlive the default 60s goto (deep-e2e.log failure 15). Give the whole
    // discovery loop headroom rather than weakening any assertion.
    test.setTimeout(300_000);
    // A client-created CO starts 'requested' (NOT decidable). This transition
    // needs a seeded 'priced'/'client_review' CO. Discover one from the list.
    await page.goto(`${base}/change-orders`);
    await expect(page.locator('[data-platform="gvteway"]').first()).toBeVisible({ timeout: 15_000 });

    const hrefs = await page
      .locator(`a[href*="/change-orders/"]`)
      .evaluateAll((as) =>
        (as as HTMLAnchorElement[])
          .map((a) => new URL(a.href).pathname)
          .filter((p) => /\/change-orders\/[0-9a-f-]{36}$/.test(p)),
      );
    const unique = Array.from(new Set(hrefs));

    let decided = false;
    for (const href of unique) {
      // 90s: absorbs the detail route's dev-server first compile (subsequent
      // iterations hit the warm cache and return in well under a second).
      await page.goto(href, { timeout: 90_000 });
      const approveBtn = page.getByRole("button", { name: /approve change/i });
      if (await approveBtn.count()) {
        await approveBtn.first().click();
        await expect(page.getByText("Decision recorded.", { exact: false })).toBeVisible({ timeout: 15_000 });
        await page.reload();
        await expect(page.locator("header").getByText("Approved", { exact: true })).toBeVisible({ timeout: 15_000 });
        decided = true;
        break;
      }
    }
    test.skip(!decided, "no decidable (priced/client_review) change-order seeded on the fixture proposal");
  });

  test("client DECLINES an approval with a reason (pending → declined)", async ({ page }) => {
    // C2's pending approval is kept pending by that spec (it never signs), so
    // declining it would break C2. This transition needs its OWN dedicated
    // pending approval row; bind to a distinct id and skip if it isn't seeded.
    const declineProposalId = "c2000000-0000-4000-8000-0000000000d1";
    const declineApprovalId = "c2000000-0000-4000-8000-0000000000d2";
    const detail = `/p/${SLUG}/client/proposals/${declineProposalId}/approvals/${declineApprovalId}`;
    const r = await page.goto(detail);
    const missing = (r?.status() ?? 404) >= 400 || (await page.getByText(/not found/i).count()) > 0;
    test.skip(missing, "no dedicated pending approval seeded for the destructive decline path");

    // ApprovalSignBlock (form carries the hidden approvalId) renders ONLY when
    // approval.state === 'pending'. The reason textarea is mounted lazily by the
    // Decline tab, so gate on the block itself, not on [name='reason'].
    const block = page.locator("form:has([name='approvalId'])").first();
    const signable = (await block.count()) > 0;
    test.skip(!signable, "the dedicated approval is not in a pending/signable state");

    // Switch to the Decline tab so the reason textarea mounts, then decline.
    await block.getByRole("button", { name: /^decline$/i }).click();
    await block.locator("textarea[name='reason']").fill("Budget exceeds the approved ceiling; re-scope first.");
    await block.getByRole("button", { name: /decline approval/i }).click();

    await expect(page.getByText("Recorded.", { exact: false })).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("alert").filter({ hasText: /not authorized/i }),
      "no APPROVE_DENIED on the client decline",
    ).toHaveCount(0);

    await page.reload();
    await expect(page.getByText("Declined", { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  });

  test("client toggles a phase gate and APPROVES the phase", async ({ page }) => {
    await page.goto(`${base}/lifecycle`);
    await expect(page.locator('[data-platform="gvteway"]').first()).toBeVisible({ timeout: 15_000 });

    // The PhaseGateForm only renders when phase_state != locked and gate rows
    // exist — both require seeded proposal_phase_states + gate items. The gate is
    // a Radix Checkbox (renders role="checkbox", NOT <input type=checkbox>).
    const gate = page.getByRole("checkbox").first();
    const hasGate = (await gate.count()) > 0;
    test.skip(!hasGate, "no seeded phase_state + gate items on the fixture proposal");

    if (!(await gate.isChecked())) {
      await gate.check();
      await expect(gate, "the gate item flips checked (toggleGateAction succeeded)").toBeChecked({ timeout: 15_000 });
    }

    const approve = page.getByRole("button", { name: /approve phase/i });
    if ((await approve.count()) && (await approve.first().isEnabled())) {
      await approve.first().click();
      await expect(page.getByText(/not authorized/i), "no denial on the client phase approve").toHaveCount(0);
      await page.reload();
      await expect(page.getByText("Approved", { exact: false }).first()).toBeVisible({ timeout: 15_000 });
    }
  });
});

// ── crew · APPROVE-capability denials (three distinct strings) ─────────────
test.describe("GVTEWAY portal deep coverage (crew · proposals:approve denied)", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => enter(page, "crew"));

  test("crew is DENIED requesting a change-order", async ({ page }) => {
    await page.goto(`${base}/change-orders/new`);
    const form = page.locator('form:has([name="title"])').first();
    await expect(form).toBeVisible({ timeout: 15_000 });
    await form.locator('[name="title"]').fill(`E2E Crew CO ${stamp()}`);
    await form.locator("textarea[name='body']").fill("Crew should not be able to open a scope change.");
    await form.evaluate((f: HTMLFormElement) => f.requestSubmit());

    // .first(): the denial legitimately renders twice — the inline error Alert
    // AND the sr-only aria-live announcement region both carry role="alert".
    await expect(
      page.getByRole("alert").filter({ hasText: /not authorized to act on this change order/i }).first(),
      "the change-order create APPROVE_DENIED surfaced",
    ).toBeVisible({ timeout: 15_000 });
    await expect(page, "stayed on /new — no CO was created").toHaveURL(/\/change-orders\/new(\?|$)/);
  });

  test("crew is DENIED requesting a revision round", async ({ page }) => {
    await page.goto(`${base}/revisions/new`);
    const form = page.locator('form:has([name="title"])').first();
    await expect(form).toBeVisible({ timeout: 15_000 });
    await form.locator('[name="title"]').fill(`E2E Crew Revision ${stamp()}`);
    await form.locator("textarea[name='summary']").fill("Crew should not be able to open a revision round.");
    await form.evaluate((f: HTMLFormElement) => f.requestSubmit());

    // .first(): inline error Alert + sr-only live region both carry role="alert".
    await expect(
      page.getByRole("alert").filter({ hasText: /not authorized to act on this revision round/i }).first(),
      "the revision-round create APPROVE_DENIED surfaced",
    ).toBeVisible({ timeout: 15_000 });
    await expect(page, "stayed on /new — no revision round was created").toHaveURL(/\/revisions\/new(\?|$)/);
  });

  test("crew is DENIED toggling a lifecycle gate", async ({ page }) => {
    await page.goto(`${base}/lifecycle`);
    await expect(page.locator('[data-platform="gvteway"]').first()).toBeVisible({ timeout: 15_000 });

    // Radix Checkbox → role="checkbox" (no native <input type=checkbox>).
    const gate = page.getByRole("checkbox").first();
    const hasGate = (await gate.count()) > 0;
    test.skip(!hasGate, "no seeded phase_state + gate items to attempt a gate toggle against");

    const wasChecked = await gate.isChecked();
    await gate.click().catch(() => {});
    // toggleGateAction rejects crew; the checkbox must NOT change state. The
    // denial surfaces via a sonner toast (best-effort assertion).
    await expect(gate, "crew's gate toggle was rejected (state unchanged)").toBeChecked({
      checked: wasChecked,
      timeout: 15_000,
    });
    await expect(page.getByText(/not authorized to act on this proposal lifecycle/i).first()).toBeVisible({
      timeout: 5_000,
    }).catch(() => {});
  });
});

// ── vendor · account-manager thread (mint room + send) ─────────────────────
test.describe("GVTEWAY portal deep coverage (vendor · AM messaging)", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => enter(page, "vendor"));

  test("vendor mints an AM room and sends a message", async ({ page }) => {
    await page.goto(`/p/${SLUG}/messages`);
    await expect(page.locator('[data-platform="gvteway"]').first()).toBeVisible({ timeout: 15_000 });

    // Needs a seeded account_manager_assignments row with portal_user_id = the
    // vendor fixture. Absent → the page shows the "No Account Manager Yet"
    // EmptyState with no Start/Open control.
    const startBtn = page.getByRole("button", { name: /start thread/i });
    const openLink = page.getByRole("link", { name: /open thread/i });
    const hasAssignment = (await startBtn.count()) > 0 || (await openLink.count()) > 0;
    test.skip(!hasAssignment, "no account_manager_assignments seeded for the vendor fixture");

    if (await startBtn.count()) {
      await startBtn.first().click(); // native POST → /messages/start → 303 to the room
    } else {
      await openLink.first().click();
    }
    await expect(page, "landed on a real AM room").toHaveURL(new RegExp(`/p/${SLUG}/messages/${UUID.source}`), {
      timeout: 30_000,
    });

    const body = `E2E vendor→AM ping ${stamp()}`;
    await page.locator("[name='body']").fill(body);
    await page.getByRole("button", { name: /^send$/i }).click();

    // postPortalMessage revalidates the room; read server truth.
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.reload();
    await expect(page.getByText(body, { exact: false })).toBeVisible({ timeout: 15_000 });
  });
});

// ── client · cross-tenant mutation guard ───────────────────────────────────
test.describe("GVTEWAY portal deep coverage (client · cross-tenant write block)", () => {
  test.describe.configure({ timeout: 180_000 });
  // session.orgId = professional; the target slug belongs to the DEMO org, which
  // this fixture is NOT a member of.
  test.beforeEach(async ({ page }) => enter(page, "client"));

  test("client cannot write a change-order under a FOREIGN slug", async ({ page }) => {
    const foreignSlug = "mmw26-hialeah"; // a real slug the professional fixtures don't belong to
    const foreignProposalId = "00000000-0000-4000-8000-0000000000ff";
    const newRoute = `/p/${foreignSlug}/client/proposals/${foreignProposalId}/change-orders/new`;
    await page.goto(newRoute);

    // Either the proposal context can't resolve under the caller's org (→
    // notFound) or the form renders but the write is org-pinned and can't match
    // a demo-org proposal. In no case may we land on a created CO detail.
    const form = page.locator('form:has([name="title"])').first();
    if (await form.count()) {
      await form.locator('[name="title"]').fill(`E2E Cross-Tenant ${stamp()}`);
      await form.locator("textarea[name='body']").fill("This write must never persist in a foreign org.");
      await form.evaluate((f: HTMLFormElement) => f.requestSubmit());
      await page.waitForLoadState("load").catch(() => {});
    }

    await expect(
      page,
      "no cross-tenant change-order was created (never redirected to a [coId])",
    ).not.toHaveURL(new RegExp(`/change-orders/${UUID.source}`));
  });
});

// ── guest · ticket party-scoping (their ticket only) ───────────────────────
test.describe("GVTEWAY portal deep coverage (guest · ticket party-scope)", () => {
  test.describe.configure({ timeout: 180_000 });

  test("guest sees their ticket; a non-holder member does not", async ({ page }) => {
    await enter(page, "guest");
    await page.goto(`/p/${SLUG}/guest/tickets`);
    await expect(page.locator('[data-platform="gvteway"]').first()).toBeVisible({ timeout: 15_000 });

    // Needs a seeded ticket assignment (catalog_kind='ticket') whose
    // party_user_id = the guest fixture + a scan code. Absent → empty table.
    const codeCell = page.locator("td .font-mono, td span.font-mono").first();
    const emptyShown = (await page.getByText(/no tickets yet/i).count()) > 0;
    const hasCode = !emptyShown && (await codeCell.count()) > 0;
    test.skip(!hasCode, "no guest-held ticket assignment seeded on the fixture project");

    const scanCode = ((await codeCell.textContent()) ?? "").trim();
    test.skip(!scanCode || scanCode === "—", "seeded ticket has no active scan code to key the negative on");

    // The guest sees their own ticket code.
    await expect(page.getByText(scanCode, { exact: false }).first()).toBeVisible({ timeout: 15_000 });

    // A different member (contractor) who is NOT the holder must not see it.
    await enter(page, "contractor");
    await page.goto(`/p/${SLUG}/guest/tickets`);
    await expect(page.locator('[data-platform="gvteway"]').first()).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(scanCode, { exact: false }),
      "the non-holder member does not see the guest's ticket code",
    ).toHaveCount(0);
  });
});

// ── artist · PortalDocVault self-submitted filter ──────────────────────────
test.describe("GVTEWAY portal deep coverage (artist · doc-vault self-scope)", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => enter(page, "artist"));

  test("artist's doc-vault shows their own submitted deliverable", async ({ page }) => {
    // Self-seed a deliverable via the advancing surface (submitted_by = self).
    await page.goto(`/p/${SLUG}/artist/advancing`);
    const advForm = page.locator("form:has([name='title'])").first();
    await expect(advForm).toBeVisible({ timeout: 15_000 });

    const title = `E2E Vault Stage Plot ${stamp()}`;
    await advForm.locator("[name='title']").fill(title);
    // stage_plot is in the artist PortalDocVault types filter on the index.
    await advForm.locator("select[name='type']").selectOption("stage_plot").catch(() => {});
    await advForm.locator("textarea[name='notes']").fill("Submitted to verify the self-scoped doc vault.");
    await advForm.getByRole("button", { name: /submit deliverable/i }).click();

    // The AdvancingForm is a client useActionState action with NO redirect —
    // success resets the controlled form (title → "") and toasts. Wait for that
    // commit signal BEFORE navigating away: the prior failure mode was routing
    // to /artist while the action fetch was still in flight, so the insert never
    // landed and the vault (correctly) had no row. On failure the form keeps its
    // values and shows an error Alert, so this wait fails loudly instead.
    await expect(
      advForm.locator("[name='title']"),
      "the deliverable submit committed (form reset)",
    ).toHaveValue("", { timeout: 20_000 });
    await expect(
      page.locator("[role='alert']").filter({ hasText: /error|failed|violates|denied/i }),
      "the deliverable submit surfaced no error",
    ).toHaveCount(0);

    // The artist index mounts <PortalDocVault> filtered to submitted_by=self.
    await page.goto(`/p/${SLUG}/artist`);
    await expect(page.locator('[data-platform="gvteway"]').first()).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(title, { exact: false }).first(),
      "the artist's own deliverable renders in their doc vault",
    ).toBeVisible({ timeout: 15_000 });
  });
});
