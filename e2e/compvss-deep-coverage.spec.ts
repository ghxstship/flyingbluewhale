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

  // Category (select) — value === option label "Radio".
  await form.locator("select").first().selectOption("Radio");
  // Item / Type (first text input).
  await form.locator("input[type='text']").first().fill(itemTitle);
  // Quantity (the lone number input).
  await form.locator("input[type='number']").first().fill("2");
  // Operational Purpose is textarea #2 (Special Requests is #1); requiredFor
  // Radio, so the CTA stays disabled until it's set.
  await form.locator("textarea").nth(1).fill("E2E ops coverage");

  await page.getByRole("button", { name: /submit request/i }).click();
  await expect(page).toHaveURL(/\/m\/advances(\?|$)/, { timeout: 20_000 });
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
    await page.locator(".composer-cta").click();
    const box = page.locator("textarea[name='message']");
    await expect(box).toBeVisible({ timeout: 10_000 });
    await box.fill(message);
    await page.locator(".ps-btn--cta").click();

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
    await dates.nth(0).fill("2030-04-10"); // From
    await dates.nth(1).fill("2030-04-05"); // To (before From)

    await page.getByRole("button", { name: /submit request/i }).click();

    // No redirect — the requestTimeOff to<from guard returns an error the
    // wrapper renders as a danger alert.
    await expect(page).toHaveURL(/\/m\/time-off\/new(\?|$)/, { timeout: 10_000 });
    await expect(page.locator(".ps-alert--danger")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".ps-alert--danger")).toContainText(
      /end date must be on or after the start date/i,
    );
  });

  // ── Time-off: happy path persists a pending request ──────────────────────
  test("Time-off happy path persists a pending request", async ({ page }) => {
    const notes = `E2E TO readback ${Date.now()}`;
    await page.goto("/m/time-off/new");
    await expectRendered(page);

    const dates = page.locator(".formscreen input[type='date']");
    await expect(dates.first()).toBeVisible({ timeout: 10_000 });
    await dates.nth(0).fill("2031-05-01"); // From
    await dates.nth(1).fill("2031-05-03"); // To
    await page.locator(".formscreen textarea").first().fill(notes);

    await page.getByRole("button", { name: /submit request/i }).click();

    await expect(page).toHaveURL(/\/m\/time-off(\?|$)/, { timeout: 20_000 });
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
    await page.goto("/m/check-in/manual");
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
