/**
 * COMPVSS field PWA (/m) — DEEP coverage.
 *
 * Deepens `e2e/compvss-field-personas.spec.ts` (which is largely render-only +
 * happy-path-URL). Where that spec asserts "landed on the list, no danger
 * alert", this one drives each journey to its DATA consequence and its AUTHZ
 * boundary:
 *
 *   • Full incident report (kit `incident` FormScreen — severity seg → DB
 *     incident_severity, Submit Report → /m/incidents) READS BACK in the queue.
 *     The personas spec only covers the EXPRESS one-textarea /m/incident/new.
 *   • Advance request find-or-creates a catalog SKU + inserts a `briefed`
 *     `assignments` row that appears in the my-advances list — untested before.
 *   • Community feed POST reads the exact message back on-page (not just render).
 *   • Time-off: BOTH the server-side invalid-range guard (to<from) AND the
 *     happy-path pending-row read-back — the personas spec only fires happy URL.
 *   • Advance detail: the party reads their OWN issued credential but the
 *     manager-only fulfillment state machine is gated off (canManage=false).
 *   • Membership / ownership notFound() gates on inbox threads + onboarding
 *     assignments — the authz boundaries of those routes.
 *   • Manual check-in resolves an unknown code to a `not_found` scan result.
 *   • Crew-scoped Boarding Pass (/m/guide) renders via mapSessionToGuidePersona
 *     with zero client pageerror — a route the personas render-loop skips.
 *   • Advance-request prefill (WCAG SC 3.3.7 Redundant Entry) carries the prior
 *     request's category forward.
 *
 * Persona = `crew` (test+crew@flyingbluewhale.app) — the same fixture the
 * personas spec uses; do NOT invent roles. The seeded party-bound credential
 * assignment (ADVANCING_FIXTURE) is the ownership fixture.
 */
import { expect, test, type Page } from "./helpers/base";
import { authedSetup } from "./helpers/auth";

const ERROR_BOUNDARY = /something went wrong|application error|unhandled|digest:/i;

/** The seeded party-bound advancing assignment (e2e/helpers/fixtures.ts). */
const CREDENTIAL_ASSIGNMENT_ID = "c3000000-0000-4000-8000-000000000002";
/** A roomId the crew user is not a chat_room_members row for. */
const FOREIGN_ROOM_ID = "00000000-0000-4000-8000-0000000000ff";
/** A new_hire_assignments id not owned by the crew user. */
const FOREIGN_ONBOARDING_ID = "00000000-0000-4000-8000-0000000000fe";

/** Assert a heading rendered and no error boundary / action error surfaced. */
async function expectRendered(page: Page) {
  await expect(page.locator(".scr-h, h1").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
}

/**
 * Fill + submit the kit `advance` FormScreen for a Radio item. Shared by the
 * create-and-read-back journey and the prefill journey. Returns the unique
 * item title so the caller can assert the row.
 */
async function submitRadioAdvance(page: Page): Promise<string> {
  const itemTitle = `Motorola R7 E2E-${Date.now()}`;
  await page.goto("/m/advances/new");
  await expectRendered(page);
  const form = page.locator(".formscreen");
  await expect(form.locator("select").first()).toBeVisible({ timeout: 10_000 });

  // FormScreen is a fully controlled client component: values entered before
  // React hydrates are wiped when the controlled inputs mount, and its Submit
  // is a type="button" onClick that silently NO-OPS while any required field
  // is missing from React state (the CTA just sits at opacity 0.5). Re-fill
  // until the CTA arms (opacity 1 proves React state carries every required
  // value), THEN click.
  const cta = page.getByRole("button", { name: /submit request/i });
  await expect(async () => {
    // Category (select) value === option label "Radio".
    await form.locator("select").first().selectOption("Radio");
    // Item / Type (first text input).
    await form.locator("input[type='text']").first().fill(itemTitle);
    // Quantity (the lone number input).
    await form.locator("input[type='number']").first().fill("2");
    // Operational Purpose is textarea #2 (Special Requests is #1); requiredFor Radio.
    await form.locator("textarea").nth(1).fill("E2E ops coverage");
    // Kit 31 (#24): BOTH Start and End Date are REQUIRED on every advance line
    // (end >= start, validated server-side too). Neither filled → CTA never arms.
    const dates = form.locator("input[type='date']");
    if (await dates.count()) {
      await dates.nth(0).fill("2030-01-01");
      await dates.nth(1).fill("2030-01-05");
    }
    await expect(cta).toHaveCSS("opacity", "1", { timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  await cta.click();

  // Success routes to the list; a server-side failure renders the danger
  // alert and stays on /new. Surface the alert text so an RLS refusal reads
  // as itself instead of a bare URL timeout.
  const danger = page.locator(".ps-alert--danger");
  await Promise.race([
    page.waitForURL(/\/m\/advances(\?|$)/, { timeout: 30_000 }),
    danger.waitFor({ state: "visible", timeout: 30_000 }),
  ]).catch(() => {});
  if (await danger.isVisible().catch(() => false)) {
    throw new Error(`advance request failed server-side: "${(await danger.innerText()).trim()}"`);
  }
  await expect(page).toHaveURL(/\/m\/advances(\?|$)/, { timeout: 5_000 });
  return itemTitle;
}

test.describe("COMPVSS field deep coverage (crew)", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "crew"));

  // ── Full incident report (kit FormScreen) ───────────────────────────────
  test("Full incident report files and reads back in the queue", async ({ page }) => {
    const what = `E2E full incident ${Date.now()}`;
    await page.goto("/m/incidents/new");
    await expectRendered(page);

    const form = page.locator(".formscreen");
    // Location (required text) — first text input; Severity seg defaults Medium.
    await form.locator("input[type='text']").first().fill("Gate 3 · E2E");
    // What Happened (required) — first textarea.
    await form.locator("textarea").first().fill(what);

    await page.getByRole("button", { name: /submit report/i }).click();

    await expect(page).toHaveURL(/\/m\/incidents(\?|$)/, { timeout: 20_000 });
    // The summary (what.slice(0,140)) renders as a queue row.
    await expect(page.getByText(what, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".ps-alert--danger"), "no error on incident file").toHaveCount(0);
  });

  // ── Advance request → briefed assignment appears ─────────────────────────
  // Guards the D1-class app-vs-RLS inversion this suite surfaced (confirmed
  // live 2026-07-10): assignments_insert had no crew self-request branch, so
  // the crew-facing /m/advances/new intake died at the assignments INSERT
  // after the catalog step succeeded (orphan SKUs, zero assignments). Fixed by
  // 20260710090000_assignments_self_request_rls (own party + 'briefed' +
  // created_by = auth.uid()); this test is the regression guard.
  test("Advance request creates a briefed assignment that appears in my advances", async ({ page }) => {
    const itemTitle = await submitRadioAdvance(page);

    // The new item renders in the my-advances list (grouped by kind → Radio).
    await expect(page.getByText(itemTitle, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
    // fulfillment_state 'briefed' → a "Briefed" state badge is present.
    await expect(page.getByText("Briefed").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".ps-alert--danger"), "no RLS error on advance request").toHaveCount(0);
  });

  // ── Community feed post → reads back ─────────────────────────────────────
  test("Feed post reads back on the community feed", async ({ page }) => {
    const message = `E2E crew feed ${Date.now()}`;
    await page.goto("/m/feed");
    await expectRendered(page);

    // Open the composer (the .composer-cta opener expands the inline post box).
    // The opener is a client-side onClick on a div (FeedView): a click that
    // lands before React hydrates is silently swallowed, so keep clicking
    // until the textarea actually appears.
    const box = page.locator("textarea[name='message']");
    await expect(async () => {
      if (!(await box.isVisible())) await page.locator(".composer-cta").click({ timeout: 2_000 });
      await expect(box).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
    await box.fill(message);
    // The composer's own submit (scoped to its form; .ps-btn--cta alone can
    // collide with other CTAs on the shell).
    await page.locator("form").filter({ has: box }).getByRole("button", { name: /^post$/i }).click();

    // createPost inserts a public recognition_post + revalidatePath('/m/feed');
    // the RSC refresh surfaces the exact body in the stream.
    await expect(page.getByText(message, { exact: false }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  });

  // ── Time-off: invalid range rejected server-side ─────────────────────────
  test("Time-off invalid range (to before from) is rejected server-side", async ({ page }) => {
    await page.goto("/m/time-off/new");
    await expectRendered(page);

    const dates = page.locator(".formscreen input[type='date']");
    await expect(dates.first()).toBeVisible({ timeout: 10_000 });

    // Same controlled-hydration trap as the happy path: values filled before
    // React hydrates get wiped, and the type="button" CTA no-ops until React
    // state holds every required value (inline opacity 0.5 -> 1). Re-fill until
    // the CTA arms, THEN click — the range validity is server-side, so the CTA
    // arms even with to < from.
    const cta = page.getByRole("button", { name: /submit request/i });
    await expect(async () => {
      await dates.nth(0).fill("2030-04-10"); // From
      await dates.nth(1).fill("2030-04-05"); // To (before From)
      await page.locator(".formscreen textarea").first().fill("E2E invalid range probe");
      await expect(cta).toHaveCSS("opacity", "1", { timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
    await cta.click();

    // No redirect — the requestTimeOff to<from Zod refine rejects. The page
    // wrapper renders only the GENERIC state.error banner ("Please fix the
    // errors below."); the specific per-field message lives in
    // state.fieldErrors, which this kit wrapper does not render (UX gap noted,
    // not asserted). The server-side rejection is the contract under test.
    await expect(page.locator(".ps-alert--danger")).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/m\/time-off\/new(\?|$)/);
    await expect(page.locator(".ps-alert--danger")).toContainText(/please fix the errors below/i);
  });

  // ── Time-off: happy path persists a pending request ──────────────────────
  test("Time-off happy path persists a pending request", async ({ page }) => {
    const notes = `E2E TO readback ${Date.now()}`;
    await page.goto("/m/time-off/new");
    await expectRendered(page);

    const dates = page.locator(".formscreen input[type='date']");
    await expect(dates.first()).toBeVisible({ timeout: 10_000 });

    // FormScreen is a controlled client component: values filled before React
    // hydrates get wiped on mount, and the type="button" Submit no-ops while
    // required fields (from/to) are missing from React state. Re-fill until
    // the CTA arms (inline opacity flips 0.5 -> 1 only once React state holds
    // every required value), THEN click. The live run failed exactly here:
    // 20s on /new with no inserted row and no alert, i.e. a swallowed submit.
    const cta = page.getByRole("button", { name: /submit request/i });
    await expect(async () => {
      await dates.nth(0).fill("2031-05-01"); // From
      await dates.nth(1).fill("2031-05-03"); // To
      await page.locator(".formscreen textarea").first().fill(notes);
      await expect(cta).toHaveCSS("opacity", "1", { timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
    await cta.click();

    // Success routes to the list; a server failure (no policy / RLS) renders
    // the danger alert and stays on /new. Surface the alert text so a real
    // refusal reads as itself instead of a bare URL timeout.
    const danger = page.locator(".ps-alert--danger");
    await Promise.race([
      page.waitForURL(/\/m\/time-off(\?|$)/, { timeout: 30_000 }),
      danger.waitFor({ state: "visible", timeout: 30_000 }),
    ]).catch(() => {});
    if (await danger.isVisible().catch(() => false)) {
      throw new Error(`time-off request failed server-side: "${(await danger.innerText()).trim()}"`);
    }
    await expect(page).toHaveURL(/\/m\/time-off(\?|$)/, { timeout: 5_000 });
    await expect(page.locator(".ps-alert--danger"), "no error on time-off request").toHaveCount(0);
    // The inserted time_off_requests row (request_state 'pending') reads back —
    // by its unique reason/notes or its 2031-05-01 span.
    await expect(
      page.getByText(notes, { exact: false }).or(page.getByText(/2031-05-01/)).first(),
      "the pending request appears in the list",
    ).toBeVisible({ timeout: 15_000 });
  });

  // ── Own credential is readable but not fulfillable (authz) ───────────────
  test("Crew reads OWN issued credential but the fulfillment state machine is gated off", async ({ page }) => {
    await page.goto(`/m/advances/${CREDENTIAL_ASSIGNMENT_ID}`);
    await expectRendered(page);

    // The party can read their own advance: title + issued state badge render.
    await expect(
      page.getByRole("heading", { name: "E2E Crew Credential" }).first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Issued").first()).toBeVisible({ timeout: 15_000 });

    // canManage = isManagerPlus(crew) = false → nextStates = [] → NO transition
    // control. None of the manager fulfillment actions render.
    await expect(
      page.getByRole("button", {
        name: /^(Transfer|Fulfill|Mark Delivered|Mark Returned|Void|Mark Expired|Approve|Reject|Issue|Submit|Send to Review|Request Revision)$/,
      }),
      "the manager-only state machine is gated off for the party",
    ).toHaveCount(0);
  });

  // ── Inbox thread membership gate ─────────────────────────────────────────
  test("Inbox thread membership gate returns notFound for a non-member room", async ({ page }) => {
    // Dynamic-segment route: first hit compiles on demand, and under a long
    // serial run the dev server can exceed the 60s default nav timeout.
    await page.goto(`/m/inbox/${FOREIGN_ROOM_ID}`, { timeout: 90_000 });

    // [roomId]/page.tsx org-pins the room then membership-gates with notFound().
    await expect(page.getByText(/surface not found/i).first()).toBeVisible({ timeout: 15_000 });
    // The ChatRoom composer must NOT be present.
    await expect(
      page.locator("textarea[placeholder='Message']"),
      "no chat composer on a gated thread",
    ).toHaveCount(0);
  });

  // ── Onboarding ownership gate ────────────────────────────────────────────
  test("Onboarding assignment ownership gate returns notFound for a foreign id", async ({ page }) => {
    // Dynamic-segment route: first-compile headroom (see inbox gate above).
    await page.goto(`/m/onboarding/${FOREIGN_ONBOARDING_ID}`, { timeout: 90_000 });

    // [assignmentId]/page.tsx filters by assignee_id=session.userId → notFound().
    await expect(page.getByText(/surface not found/i).first()).toBeVisible({ timeout: 15_000 });
    // The step checklist / MarkStepDone controls are absent.
    await expect(
      page.getByRole("button", { name: /mark (step )?done|complete/i }),
      "no onboarding step controls on a foreign assignment",
    ).toHaveCount(0);
  });

  // ── Manual check-in of an unknown code ───────────────────────────────────
  test("Manual check-in of an unknown code logs a not_found result", async ({ page }) => {
    // Heavy first-compile route: give the nav headroom past the 60s default
    // under a long serial run (same budget as the inbox/onboarding gates).
    await page.goto("/m/check-in/manual", { timeout: 90_000 });
    await expectRendered(page);

    await page.locator("input[name='code']").fill("E2E-BOGUS-000");
    await page.getByRole("button", { name: /submit code/i }).click();

    // scanCode → scanAssignment resolves the unknown code to result 'not_found'
    // (RESULT_TONE neutral), surfaced as a result badge.
    await expect(page.getByText("not_found").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  });

  // ── Daily log create → row reads back ────────────────────────────────────
  test("Daily log create reads back on the list", async ({ page }) => {
    const notes = `E2E daily readback ${Date.now()}`;
    await page.goto("/m/daily-log/new");
    await expectRendered(page);

    const form = page.locator("main form, .screen form").first();
    await expect(form).toBeVisible({ timeout: 10_000 });
    // Pin a stable future date so the upsert (org,project,date) key doesn't
    // collide with other daily-log tests, and leave weather empty so the list
    // subtitle falls back to the notes text (its read-back handle).
    await page.locator("input[name='log_date']").fill("2033-11-15");
    await page.locator("textarea[name='notes']").fill(notes);
    await page.getByRole("button", { name: /save log/i }).click();

    await expect(page).toHaveURL(/\/m\/daily-log(\?|$)/, { timeout: 20_000 });
    await expect(page.locator(".ps-alert--danger"), "no error on daily-log save").toHaveCount(0);
    // The saved row's notes render as the list subtitle.
    await expect(page.getByText(notes, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  });

  // ── Crew-scoped Boarding Pass renders ────────────────────────────────────
  test("Crew-scoped event guide (/m/guide) renders with no client error", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    // Heavy first-compile route (GuideView + persona mapping): give the nav
    // headroom past the 60s default under a long serial run.
    await page.goto("/m/guide", { timeout: 90_000 });
    // GuideView (or the No-Guide-Yet empty state) renders a heading; either way
    // the persona→guide mapping resolved without an error boundary.
    await expectRendered(page);
    expect(errors, "/m/guide threw a client-side error").toEqual([]);
  });

  // ── Advance-request prefill (WCAG redundant entry) ───────────────────────
  // Depends on a successful crew advance request (the RLS self-request branch
  // added in 20260710090000_assignments_self_request_rls — see the guard above).
  test("Advance-request prefill carries the prior category forward", async ({ page }) => {
    // Seed a Radio advance so an assignments row exists for the requester.
    await submitRadioAdvance(page);

    // Second visit: page.tsx seeds `initial` from the most-recent assignment;
    // KIND_TO_CATEGORY maps radio → "Radio".
    await page.goto("/m/advances/new");
    await expectRendered(page);
    const select = page.locator(".formscreen select").first();
    await expect(select).toBeVisible({ timeout: 10_000 });
    await expect(select, "Category is pre-seeded from the last request's catalog_kind").toHaveValue("Radio");
    // Quantity carried forward too (prior request set qty=2).
    await expect(page.locator(".formscreen input[type='number']").first()).toHaveValue("2");
  });
});
