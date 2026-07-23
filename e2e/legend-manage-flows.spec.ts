/**
 * LEG3ND manage/lifecycle flows — the mutation-heavy operator arcs the
 * render sweep (legend-personas) and the depth spec (legend-deep-coverage)
 * deliberately leave alone.
 *
 * What this file proves, end to end:
 *
 *   1. TEACH lifecycle (the marquee, L-P6a): owner authors a course →
 *      publish is REFUSED honestly (no published lesson) → lesson authored +
 *      published → course publishes → the LEARNER sees it in /legend/learn,
 *      enrolls, and completes the lesson → owner adds an assessment whose
 *      publish is refused (no question) → question added → assessment
 *      publishes → the learner's course overview surfaces the quiz link →
 *      owner archives → the course vanishes from the learner catalog.
 *   2. Live sessions (B-2): schedule → renders on /legend/live for the
 *      learner → cancel → gone (the list filters `.neq('cancelled')`).
 *   3. Certification definitions (B-5): create → retire (soft facet, holders
 *      keep verifying) → restore. Recert queue (B-3): a seeded EXPIRED
 *      holding for the crew fixture drives the full request → deny-with-note
 *      loop, and the requester sees the denial chip in their wallet.
 *   4. Store economy (B-4b): owner stocks a credit-priced item + mints a
 *      2-code voucher batch → the item renders in Spend-your-credits with the
 *      HONEST insufficient-balance disable (price 999999 ≫ any balance, so no
 *      purchase and no Stripe is ever attempted) → one voucher voided.
 *   5. Crews (S-2): learner joins the seeded E2E crew → the membership
 *      renders (Join flips to Leave) → leaves.
 *   6. Badges: wire-level render only — the collection grid + metrics. The
 *      badge EARN path is not driven live (course completion is covered in
 *      the teach arc without awaiting awards; award triggers are owner-band).
 *
 * Personas (seeded by scripts/seed-e2e-fixtures.mjs): `owner` (role=owner,
 * the operator) and `crew` (role=member/persona=crew, the learner). Both pin
 * org f4509a5f (Test Professional Org — the LEG3ND clone seed). The seeder
 * also provisions manager/viewer/admin/…, but there is NO seeded LEG3ND
 * certification HOLDER and NO seeded legend crew — those two fixtures are
 * seeded in-spec through an RLS-scoped owner Supabase client (no service
 * role; the owner sits inside every legend write band) and torn down with
 * everything else.
 *
 * Fixture hygiene: every row this file creates is "E2E "-prefixed (or
 * E2E-*-coded) with a per-run stamp, and the file-level `afterAll` purges by
 * PATTERN (not id) as the owner fixture — so it also clears residue from
 * prior interrupted runs, and a serial-group retry (fresh worker → fresh
 * stamp) never collides with its predecessor's half-built rows. The same
 * patterns are registered in scripts/e2e-clean-fixtures.mjs (the Playwright
 * globalTeardown) as the safety net for runs that die before afterAll.
 * Deletes cascade: courses → lessons/assessments/questions/enrollments,
 * sessions → registrations, certifications → holders → recerts, crews →
 * memberships. Course points_reward stays 0 so no points_ledger residue.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient as createSbClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "./helpers/base";
import { authedSetup, fixtureEmail, TEST_PASSWORD } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";
import { TEST_ORGS } from "./helpers/fixtures";

const UUID = /[0-9a-f-]{36}/;
const RLS_ERROR = /violates row-level security|permission denied|not authorized/i;
const PROF_ORG = TEST_ORGS.professional;

// One stamp per worker. A failed serial group retries in a FRESH worker, so
// the module re-evaluates and every retry works against new fixture names.
const S = stamp();
const COURSE_TITLE = `E2E Course ${S}`;
const LESSON_TITLE = `E2E Lesson ${S}`;
const ASSESSMENT_TITLE = `E2E Assessment ${S}`;
const SESSION_TITLE = `E2E Session ${S}`;
const CT_CODE = `E2E-CT-${S}`;
const CT_NAME = `E2E Cert ${S}`;
const RC_CODE = `E2E-RC-${S}`;
const RC_NAME = `E2E Recert Cert ${S}`;
const DENIAL_NOTE = `E2E denial note ${S}`;
const ITEM_NAME = `E2E Store Item ${S}`;
const ITEM_SKU = `E2E-SKU-${S}`;
// Credit price no learner balance can reach → the purchase control is always
// the honest disabled state; nothing is ever bought and Stripe never runs.
const ITEM_PRICE = 999999;
// Voucher prefix: alphanumeric, ≤16 chars (schema), pattern-purgeable "E2EV%".
const VPREFIX = `E2EV${S.slice(-8)}`;
const CREW_NAME = `E2E Crew ${S}`;

/** Pull the record id out of the current detail URL (…/<segment>/<uuid>). */
function idFromUrl(page: Page): string {
  const m = page.url().match(/\/([0-9a-f-]{36})(?:\?|#|$)/);
  expect(m?.[1], `URL ${page.url()} carries a record uuid`).toBeTruthy();
  return m![1]!;
}

// ── RLS-scoped Supabase access as a fixture user (no service role) ─────────
function envVal(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  try {
    const txt = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    return txt.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();
  } catch {
    return undefined;
  }
}
const hasSbEnv = !!(envVal("NEXT_PUBLIC_SUPABASE_URL") && envVal("NEXT_PUBLIC_SUPABASE_ANON_KEY"));

/**
 * A Supabase client signed in as a fixture user. NEVER call signOut() on
 * these — the default scope is "global", which revokes every session for the
 * user server-side, including the Playwright browser session (known trap).
 * Abandoning the token is safe (no persistence, no auto-refresh).
 */
async function fixtureDb(role: string) {
  const url = envVal("NEXT_PUBLIC_SUPABASE_URL");
  const anon = envVal("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !anon) return null;
  const sb = createSbClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await sb.auth.signInWithPassword({ email: fixtureEmail(role), password: TEST_PASSWORD });
  if (error) return null;
  return sb;
}

/** The auth uid of a fixture user, recovered by signing in (no admin API). */
async function fixtureUserId(role: string): Promise<string | null> {
  const sb = await fixtureDb(role);
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}

// ── Teardown: purge by pattern as the owner fixture, even on failure ───────
// Cascades cover the children (lessons/questions/enrollments/registrations/
// holders/recerts/crew memberships). Voided/active vouchers and archived
// products delete cleanly (no dependents). Best-effort — never turns a green
// run red; scripts/e2e-clean-fixtures.mjs repeats these patterns globally.
test.afterAll(async () => {
  try {
    const db = await fixtureDb("owner");
    if (!db) return;
    await db.from("legend_courses").delete().like("title", "E2E Course %");
    await db.from("legend_live_sessions").delete().like("title", "E2E Session %");
    await db.from("legend_certifications").delete().like("code", "E2E-CT-%");
    await db.from("legend_certifications").delete().like("code", "E2E-RC-%");
    await db.from("credit_products").delete().like("name", "E2E Store Item %");
    await db.from("vouchers").delete().like("code", "E2EV%");
    await db.from("legend_crews").delete().like("name", "E2E Crew %");
  } catch {
    // Cleanup is hygiene; the globalTeardown pattern purge is the backstop.
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 1 · TEACH lifecycle — author → honest publish gates → learner → archive
// ══════════════════════════════════════════════════════════════════════════
test.describe("TEACH lifecycle (course → lesson → assessment → archive)", () => {
  // Serial: each step builds on the last; a mid-chain failure retries the
  // whole group in a fresh worker (fresh stamp — no fixture collisions).
  test.describe.configure({ mode: "serial", timeout: 300_000 });

  let courseId = "";

  test("owner: draft course → publish refused honestly → lesson published → course live", async ({ page }) => {
    await authedSetup(page, "owner");

    // ── Create (draft, points_reward 0 → no points_ledger residue) ─────────
    await createInModule(page, "/legend/teach/new", {
      title: COURSE_TITLE,
      summary: "Authored by the LEG3ND manage-flows e2e journey.",
    });
    await expect(page).toHaveURL(new RegExp(`/legend/teach/${UUID.source}`), { timeout: 35_000 });
    courseId = idFromUrl(page);

    // ── Publish refused: no published lesson yet (the honest gate) ─────────
    const stateBar = page.locator("div.surface").filter({ hasText: "Drafts are invisible to learners" }).first();
    await expect(stateBar).toBeVisible({ timeout: 15_000 });
    await stateBar.getByRole("button", { name: "Publish" }).click();
    await expect(
      stateBar.getByRole("alert"),
      "publishing a lesson-less course is refused with the honest guard",
    ).toContainText("Publish requires at least one published lesson", { timeout: 20_000 });
    // Still a draft — the refusal wrote nothing.
    await expect(stateBar.getByText("Draft", { exact: true })).toBeVisible();

    // ── Author + publish the lesson ────────────────────────────────────────
    await createInModule(page, `/legend/teach/${courseId}/lessons/new`, {
      title: LESSON_TITLE,
      kind: "article",
      duration_minutes: "5",
    });
    await expect(page).toHaveURL(new RegExp(`/legend/teach/${courseId}(\\?|$)`), { timeout: 35_000 });
    const lessonRow = page.locator("li").filter({ hasText: LESSON_TITLE }).first();
    await expect(lessonRow).toBeVisible({ timeout: 15_000 });
    await lessonRow.getByRole("button", { name: "Publish" }).click();
    await expect(lessonRow.getByText("Published", { exact: true }), "the lesson state flipped to Published").toBeVisible(
      { timeout: 20_000 },
    );

    // ── Now the course publishes ───────────────────────────────────────────
    await stateBar.getByRole("button", { name: "Publish" }).click();
    await expect(
      page.getByText("Live in the learner catalog.", { exact: true }),
      "the course is published (live-catalog hint replaces the draft hint)",
    ).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText(RLS_ERROR)).toHaveCount(0);
  });

  test("learner: sees the published course, enrolls, completes the lesson", async ({ page }) => {
    await authedSetup(page, "crew");

    // ── Catalog surfaces the published course ──────────────────────────────
    await page.goto("/legend/learn");
    const courseLink = page.getByRole("link", { name: new RegExp(COURSE_TITLE) }).first();
    await expect(courseLink, "the published course renders in the learner catalog").toBeVisible({ timeout: 15_000 });
    await courseLink.click();
    await expect(page).toHaveURL(new RegExp(`/legend/learn/${courseId}`), { timeout: 35_000 });

    // ── Enroll (idempotent server action; redirects back to the overview) ──
    await page.getByRole("button", { name: /^enroll$/i }).click();
    await expect(page.getByRole("link", { name: /start course/i }), "enrollment landed — the Start CTA renders").toBeVisible(
      { timeout: 35_000 },
    );

    // ── Complete the single lesson → progress 100% ─────────────────────────
    await page.locator(`a[href*="/lesson/"]`).first().click();
    await expect(page).toHaveURL(/\/lesson\/[0-9a-f-]{36}/, { timeout: 35_000 });
    const done = page.getByRole("button", { name: /mark complete & continue/i });
    await expect(done).toBeVisible({ timeout: 15_000 });
    await done.click();
    // Last lesson → routes back to the overview; the Learn step reads 1/1.
    await expect(page).toHaveURL(new RegExp(`/legend/learn/${courseId}(\\?|$)`), { timeout: 35_000 });
    await expect(page.getByText("1/1 lessons"), "lesson completion rolled up into the enrollment").toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(RLS_ERROR)).toHaveCount(0);
  });

  test("owner: assessment publish refused without a question → question added → published", async ({ page }) => {
    await authedSetup(page, "owner");

    // ── Create the assessment (lands on its builder) ───────────────────────
    await createInModule(page, `/legend/teach/${courseId}/assessments/new`, {
      title: ASSESSMENT_TITLE,
      pass_pct: "70",
    });
    await expect(page).toHaveURL(new RegExp(`/legend/teach/${courseId}/assessments/${UUID.source}`), {
      timeout: 35_000,
    });
    const assessmentId = idFromUrl(page);

    // ── Publish refused: zero questions (the honest gate) ──────────────────
    const stateBar = page.locator("div.surface").filter({ hasText: "Publish needs at least one question" }).first();
    await expect(stateBar).toBeVisible({ timeout: 15_000 });
    await stateBar.getByRole("button", { name: "Publish" }).click();
    await expect(
      stateBar.getByRole("alert"),
      "publishing a question-less assessment is refused with the honest guard",
    ).toContainText("Publish requires at least one question", { timeout: 20_000 });

    // ── Add the question (options one per line; answer key is 1-based) ─────
    await createInModule(page, `/legend/teach/${courseId}/assessments/${assessmentId}/questions/new`, {
      prompt: `E2E Question ${S}: which option is correct?`,
      options: "The correct option\nA distractor",
      correct_number: "1",
      points: "1",
    });
    await expect(page).toHaveURL(new RegExp(`/legend/teach/${courseId}/assessments/${assessmentId}(\\?|$)`), {
      timeout: 35_000,
    });

    // ── Publish sticks now ─────────────────────────────────────────────────
    await stateBar.getByRole("button", { name: "Publish" }).click();
    await expect(
      page.getByText("Learners see this after finishing the lessons.", { exact: true }),
      "the assessment is published (published hint replaces the draft hint)",
    ).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText(RLS_ERROR)).toHaveCount(0);
  });

  test("learner: the course overview surfaces the quiz link", async ({ page }) => {
    await authedSetup(page, "crew");
    await page.goto(`/legend/learn/${courseId}`);
    // Enrolled + all lessons done (test 2) + a published assessment (test 3)
    // → the overview renders the assessment CTA into the quiz route.
    const quizLink = page.locator(`a[href*="/legend/learn/${courseId}/quiz/"]`).first();
    await expect(quizLink, "the published assessment surfaces as the quiz link").toBeVisible({ timeout: 15_000 });
    await expect(quizLink).toHaveText(/take assessment|review assessment/i);
  });

  test("owner: archives the course", async ({ page }) => {
    await authedSetup(page, "owner");
    await page.goto(`/legend/teach/${courseId}`);
    const stateBar = page.locator("div.surface").filter({ hasText: "Live in the learner catalog" }).first();
    await expect(stateBar).toBeVisible({ timeout: 15_000 });
    await stateBar.getByRole("button", { name: "Archive" }).click();
    await expect(
      page.getByText("Hidden from the catalog. Restore to edit and republish.", { exact: true }),
      "the course is archived (hidden-from-catalog hint)",
    ).toBeVisible({ timeout: 25_000 });
  });

  test("learner: the archived course is gone from the catalog", async ({ page }) => {
    await authedSetup(page, "crew");
    await page.goto("/legend/learn");
    await expect(page.getByRole("heading", { name: "Courses & LMS" })).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(COURSE_TITLE),
      "the archived course no longer renders in the learner catalog",
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 2 · Live sessions — schedule → learner sees it → cancel → gone
// ══════════════════════════════════════════════════════════════════════════
test.describe("Live sessions (schedule → render → cancel)", () => {
  test.describe.configure({ mode: "serial", timeout: 240_000 });

  let sessionId = "";

  test("owner: schedules a session", async ({ page }) => {
    await authedSetup(page, "owner");
    await createInModule(page, "/legend/teach/sessions/new", {
      title: SESSION_TITLE,
      kind: "webinar",
      starts_at: "2030-01-01T10:00",
      duration_minutes: "60",
    });
    await expect(page).toHaveURL(new RegExp(`/legend/teach/sessions/${UUID.source}`), { timeout: 35_000 });
    sessionId = idFromUrl(page);
    await expect(page.getByText("Scheduled", { exact: true }).first(), "the new session is Scheduled").toBeVisible({
      timeout: 15_000,
    });
  });

  test("learner: the scheduled session renders on /legend/live", async ({ page }) => {
    await authedSetup(page, "crew");
    await page.goto("/legend/live");
    const row = page.locator("li.surface").filter({ hasText: SESSION_TITLE }).first();
    await expect(row, "the scheduled session is listed for the learner").toBeVisible({ timeout: 15_000 });
    // Registration affordance present (not driven — registration itself is
    // covered by the persona spec's learner spine).
    await expect(row.getByRole("button").first()).toBeVisible();
  });

  test("owner: cancels the session", async ({ page }) => {
    await authedSetup(page, "owner");
    await page.goto(`/legend/teach/sessions/${sessionId}`);
    // Scope to the lifecycle bar — the SessionForm below also renders a
    // "Cancel" (link) via FormShell's cancelHref.
    const stateBar = page.locator("div.surface").filter({ hasText: "Scheduled sessions go live" }).first();
    await expect(stateBar).toBeVisible({ timeout: 15_000 });
    await stateBar.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(
      page.getByText("This session is closed. Schedule a new one to run it again.", { exact: true }),
      "the session reached the terminal cancelled state",
    ).toBeVisible({ timeout: 25_000 });
  });

  test("learner: the cancelled session is gone from /legend/live", async ({ page }) => {
    await authedSetup(page, "crew");
    await page.goto("/legend/live");
    await expect(page.getByRole("heading", { name: "Live Sessions" })).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(SESSION_TITLE),
      "cancelled sessions are filtered out of the learner list",
    ).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 3 · Certification definitions + the recert decision loop
// ══════════════════════════════════════════════════════════════════════════
test.describe("Certification definitions (create → retire → restore)", () => {
  test.describe.configure({ timeout: 240_000 });

  test("owner: creates a credential type, retires it, restores it", async ({ page }) => {
    await authedSetup(page, "owner");
    await createInModule(page, "/legend/certifications/definitions/new", {
      code: CT_CODE,
      name: CT_NAME,
      validity_months: "12",
      recert_window_days: "30",
    });
    await expect(page).toHaveURL(new RegExp(`/legend/certifications/definitions/${UUID.source}`), {
      timeout: 35_000,
    });

    // Retire — a soft facet: holders keep their artifacts, verify stays live.
    await page.getByRole("button", { name: "Retire", exact: true }).click();
    await expect(page.getByText("Retired", { exact: true }).first(), "the type shows the Retired badge").toBeVisible({
      timeout: 25_000,
    });
    await expect(
      page.getByText(/existing holders keep their certificates and verification stays live/i),
      "retirement explains the soft-facet semantics",
    ).toBeVisible();

    // Restore.
    await page.getByRole("button", { name: "Restore", exact: true }).click();
    await expect(page.getByText("Active", { exact: true }).first(), "the type is active again").toBeVisible({
      timeout: 25_000,
    });
    await expect(page.getByText(RLS_ERROR)).toHaveCount(0);
  });
});

test.describe("Recert queue (request → deny with note → requester sees it)", () => {
  // No seeded certification HOLDER fixture exists (the LEG3ND clone seed,
  // 20260625161724, clones certification TYPES only), so the holding is
  // seeded here through the RLS-scoped owner client (certification_holders
  // insert admits the owner band) with expires_on = yesterday → the wallet
  // computes "Expired" and renders the Request-recert control. Without env
  // creds for that seed the loop skips honestly (queue render is still
  // asserted by the owner step when it runs).
  test.describe.configure({ mode: "serial", timeout: 240_000 });

  test("learner: requests recert on the seeded expired holding", async ({ page }) => {
    test.skip(!hasSbEnv, "no Supabase env creds to seed the certification-holder fixture");
    const db = await fixtureDb("owner");
    expect(db, "owner fixture Supabase sign-in").toBeTruthy();
    const crewId = await fixtureUserId("crew");
    expect(crewId, "crew fixture uid resolves").toBeTruthy();

    const { data: cert, error: certErr } = await db!
      .from("legend_certifications")
      .insert({
        org_id: PROF_ORG,
        code: RC_CODE,
        name: RC_NAME,
        description: "Seeded by the LEG3ND manage-flows e2e recert loop.",
        validity_months: 12,
        recert_window_days: 30,
        certification_state: "active",
      })
      .select("id")
      .single();
    expect(certErr, "cert type seed insert").toBeNull();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { error: holderErr } = await db!.from("certification_holders").insert({
      org_id: PROF_ORG,
      certification_id: cert!.id,
      user_id: crewId!,
      expires_on: yesterday, // effective state = expired → recertable
    });
    expect(holderErr, "holder seed insert").toBeNull();

    await authedSetup(page, "crew");
    await page.goto("/legend/certifications");
    const card = page.locator("div.surface").filter({ hasText: RC_NAME }).first();
    await expect(card, "the seeded holding renders in the wallet").toBeVisible({ timeout: 15_000 });
    await expect(card.getByText("Expired", { exact: true }), "the holding computes as Expired").toBeVisible();
    await card.getByRole("button", { name: /request recert/i }).click();
    await expect(
      card.getByText(/recert requested/i),
      "the append-only recert request persisted",
    ).toBeVisible({ timeout: 20_000 });
  });

  test("owner: the queue renders the request and records a deny with a note", async ({ page }) => {
    test.skip(!hasSbEnv, "no Supabase env creds to seed the certification-holder fixture");
    await authedSetup(page, "owner");
    await page.goto("/legend/compliance/recerts");
    await expect(page.getByRole("heading", { name: "Recert Queue" })).toBeVisible({ timeout: 15_000 });

    const row = page.locator("tr").filter({ hasText: RC_NAME }).first();
    await expect(row, "the learner's request landed in the pending queue").toBeVisible({ timeout: 15_000 });
    // Deny is two-step: reveal the note field, then confirm.
    await row.getByRole("button", { name: "Deny", exact: true }).click();
    await row.locator('input[name="note"]').fill(DENIAL_NOTE);
    await row.getByRole("button", { name: "Confirm Deny" }).click();
    await expect(row.getByText("Decided", { exact: true }), "the decision persisted").toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(RLS_ERROR)).toHaveCount(0);
  });

  test("learner: the wallet shows the denial chip with the note", async ({ page }) => {
    test.skip(!hasSbEnv, "no Supabase env creds to seed the certification-holder fixture");
    await authedSetup(page, "crew");
    await page.goto("/legend/certifications");
    await expect(
      page.getByText(`Recert denied: ${DENIAL_NOTE}`),
      "the requester sees the denial with the decision note",
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4 · Store economy — stock an item, mint + void vouchers, honest disable
// ══════════════════════════════════════════════════════════════════════════
test.describe("Store economy (stock → mint → void → honest purchase gate)", () => {
  test.describe.configure({ mode: "serial", timeout: 240_000 });

  test("owner: stocks a credit-priced item and mints + voids a voucher batch", async ({ page }) => {
    await authedSetup(page, "owner");

    // ── Item product (kind=item → priced in credits, money price 0) ────────
    await createInModule(page, "/legend/store/admin/products/new", {
      product_kind: "item",
      sku: ITEM_SKU,
      name: ITEM_NAME,
      credits: String(ITEM_PRICE),
    });
    await expect(page).toHaveURL(/\/legend\/store\/admin(\?|$)/, { timeout: 35_000 });
    await expect(page.getByRole("link", { name: ITEM_NAME }), "the stocked item lists in the admin register").toBeVisible(
      { timeout: 15_000 },
    );

    // ── Mint a 2-code voucher batch ────────────────────────────────────────
    await createInModule(page, "/legend/store/admin/vouchers/new", {
      prefix: VPREFIX,
      count: "2",
      credits: "5",
    });
    await expect(page).toHaveURL(/\/legend\/store\/admin\?minted=2/, { timeout: 35_000 });
    await expect(page.getByText("Minted 2 voucher codes.", { exact: true })).toBeVisible({ timeout: 15_000 });
    const codeCells = page.getByRole("cell").filter({ hasText: new RegExp(`^${VPREFIX}-`) });
    await expect(codeCells, "both minted codes render in the register").toHaveCount(2, { timeout: 15_000 });

    // ── Void one code; the other stays active ──────────────────────────────
    const firstCode = (await codeCells.first().innerText()).trim();
    const voidRow = page.locator("tr").filter({ hasText: firstCode }).first();
    await voidRow.getByRole("button", { name: "Void", exact: true }).click();
    await expect(voidRow.getByRole("button", { name: "Void", exact: true }), "the void control leaves the voided row").toHaveCount(
      0,
      { timeout: 25_000 },
    );
    await expect(voidRow.getByText("Void", { exact: true }), "the voided code shows the Void state").toBeVisible();
    // The sibling code is untouched — still voidable.
    const siblingRow = page
      .locator("tr")
      .filter({ hasText: new RegExp(`${VPREFIX}-`) })
      .filter({ hasNotText: firstCode })
      .first();
    await expect(siblingRow.getByRole("button", { name: "Void", exact: true })).toBeVisible();
    await expect(page.getByText(RLS_ERROR)).toHaveCount(0);
  });

  test("learner: the item renders with the honest insufficient-balance disable", async ({ page }) => {
    await authedSetup(page, "crew");
    await page.goto("/legend/store");
    await expect(page.getByRole("heading", { name: "Spend your credits" })).toBeVisible({ timeout: 15_000 });

    const card = page.locator("div.surface").filter({ hasText: ITEM_NAME }).first();
    await expect(card, "the stocked item renders in Spend-your-credits").toBeVisible({ timeout: 15_000 });
    // Price 999999 ≫ any fixture balance → the control is disabled with the
    // shortfall copy. Nothing is purchasable, so no purchase (and certainly
    // no Stripe checkout) is ever attempted.
    const redeem = card.getByRole("button", { name: new RegExp(`Redeem ${ITEM_PRICE} credits`) });
    await expect(redeem).toBeVisible();
    await expect(redeem, "the unaffordable item's control is disabled").toBeDisabled();
    await expect(
      card.getByText(/You need \d+ more credits\./),
      "the shortfall is stated honestly",
    ).toBeVisible();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 5 · Crews — join renders the membership, leave removes it
// ══════════════════════════════════════════════════════════════════════════
test.describe("Crews (join → membership renders → leave)", () => {
  test.describe.configure({ timeout: 240_000 });

  test("learner: joins the seeded crew and leaves it", async ({ page }) => {
    // No legend crew is seeded in the Test Professional Org (the LEG3ND clone
    // seed carries none), and /legend/crew has no create UI — crews are
    // owner/admin/manager/controller-band rows. Seed one through the
    // RLS-scoped owner client; teardown deletes it (memberships cascade).
    test.skip(!hasSbEnv, "no Supabase env creds to seed the crew fixture");
    const db = await fixtureDb("owner");
    expect(db, "owner fixture Supabase sign-in").toBeTruthy();
    const { error } = await db!.from("legend_crews").insert({
      org_id: PROF_ORG,
      name: CREW_NAME,
      description: "Seeded by the LEG3ND manage-flows e2e crew loop.",
      crew_state: "active",
    });
    expect(error, "crew seed insert").toBeNull();

    await authedSetup(page, "crew");
    await page.goto("/legend/crew");
    const row = page.locator("div.flex.items-center.gap-2").filter({ hasText: CREW_NAME }).first();
    await expect(row, "the seeded crew renders on the board").toBeVisible({ timeout: 15_000 });

    // Join → the self-insert lands and the control flips to Leave (the
    // membership render). The action reads its insert back, so a policy-
    // filtered no-op would surface as an inline error instead.
    await row.getByRole("button", { name: "Join", exact: true }).click();
    await expect(row.getByRole("button", { name: "Leave", exact: true }), "membership renders as the Leave control").toBeVisible(
      { timeout: 25_000 },
    );
    await expect(row.getByRole("alert")).toHaveCount(0);

    // Leave → own-row delete; the control flips back.
    await row.getByRole("button", { name: "Leave", exact: true }).click();
    await expect(row.getByRole("button", { name: "Join", exact: true }), "the membership is gone after leaving").toBeVisible(
      { timeout: 25_000 },
    );
    await expect(row.getByRole("alert")).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6 · Badges — wire-level render only (no live earn loop)
// ══════════════════════════════════════════════════════════════════════════
test.describe("Badges (collection surface renders)", () => {
  test.describe.configure({ timeout: 120_000 });

  test("learner: the badge collection renders its metrics and grid", async ({ page }) => {
    // Wire-level only by design: earning a badge live would need an
    // achievement-granting course (completion_achievement_id) plus an award
    // trigger — the completion loop itself is proven in the TEACH arc above
    // without awaiting awards. Here we assert the collection surface reads
    // the achievements catalog + the caller's awards without error.
    await authedSetup(page, "crew");
    await page.goto("/legend/badges");
    await expect(page.getByRole("heading", { name: "Badges", exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Earned", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/^\d+ \/ \d+$/).first(), "the earned/total metric computed").toBeVisible();
    if (await page.getByText("No badges configured").count()) {
      // Honest empty state — the org has no achievements catalog.
      await expect(page.getByText("No badges configured")).toBeVisible();
    } else {
      await expect(page.getByText("Points Earned", { exact: true })).toBeVisible();
      await expect(page.getByText("Locked", { exact: true })).toBeVisible();
    }
    await expect(page.getByText(RLS_ERROR)).toHaveCount(0);
  });
});
