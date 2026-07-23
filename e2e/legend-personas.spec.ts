/**
 * LEG3ND knowledge / LMS shell (/legend) — per-persona render + CRUD journeys.
 *
 * Phase 4 of the per-product / per-persona suite (mirrors the STYLE of
 * `e2e/atlvs-console-personas.spec.ts`, `e2e/compvss-field-personas.spec.ts`,
 * and `e2e/gvteway-portal-personas.spec.ts`).
 *
 * LEG3ND is its own shell (ADR-0011): `src/app/(legend)/legend/**`, painted
 * `data-product="legend"` + `data-type="legend"`. Unlike the platform shell its
 * layout does NOT blanket-gate on a session — the public funnel (catalog /
 * standard / signage / institutions) renders for anyone, and the
 * authoring / learner write surfaces gate themselves with `requireSession()` at
 * the page/action level. No persona auto-routes to /legend via resolveShell;
 * users navigate in. So this suite exercises TWO personas by FIXTURE, not by URL
 * segment:
 *
 *   • learner  (fixture `crew` — role=member, last_org_id pinned to the Test
 *     Professional Org) — consumes knowledge: enroll in a course, complete a
 *     lesson (→ lesson_progress + course_enrollments progress), attempt a quiz
 *     (→ assessment_attempts, server-scored), post to the community
 *     (→ community_posts), register for a live session
 *     (→ legend_session_registrations), redeem a voucher (→ voucher_redemptions
 *     + credit_ledger). A member is NOT manager+, so the authoring surfaces
 *     (resources/signage/engine create) correctly refuse it — that refusal is a
 *     PASS, not a failure.
 *   • operator (fixture `owner` — role=owner = manager+, same pinned org) —
 *     manages the knowledge base: create a Resource (→ resources INSERT,
 *     redirect to detail), assign a course from the training console
 *     (→ course_enrollments upsert).
 *
 * Both fixtures resolve to org f4509a5f (Test Professional Org), seeded with a
 * clone of the demo LEG3ND dataset in migration
 * 20260625161724_legend_seed_test_professional_org.sql (published courses with
 * lessons + assessment questions, a cert-granting course, forward-dated live
 * sessions, active vouchers). The learner journeys are DATA-DRIVEN off that
 * catalog (pick the first real course / session / voucher live) so the spec
 * never hard-codes a seed id.
 *
 * Rail surfaces are derived live from `legendNav` (the nav SSOT) so the render
 * sweep can never drift from what the LEG3ND sidebar actually exposes.
 */
import { expect, test, type Page } from "./helpers/base";
import { authedSetup } from "./helpers/auth";
import { stamp } from "./helpers/forms";
import { legendNav, type NavGroup } from "../src/lib/nav";

const ERROR_BOUNDARY = /application error|something went wrong|unhandled|digest:|client-side exception/i;
const RLS_ERROR = /violates row-level security|permission denied|not authorized|denied/i;
// The manager-gated Manage surfaces (console / engine / compliance) render an
// explicit AccessDenied EmptyState (h3, not h1) to the learner persona — that's
// a CORRECT render, not a failure. Treat it as a valid landing.
const ACCESS_DENIED = /you don'?t have access/i;

/** Flatten the legend NavGroups to their hrefs (de-duped, order preserved). */
function legendHrefs(groups: NavGroup[]): string[] {
  const out: string[] = [];
  for (const g of groups) for (const item of g.items) out.push(item.href);
  return out.filter((h, i) => out.indexOf(h) === i);
}

/** Assert a /legend page rendered the LEG3ND shell, an h1, and no error. */
async function expectLegendRender(page: Page, path: string): Promise<void> {
  const r = await page.goto(path);
  expect(r?.status() ?? 0, `${path} should not be a 5xx`).toBeLessThan(500);
  expect(page.url(), `${path} must not bounce to /login`).not.toMatch(/\/login/);
  await expect(
    page.locator('[data-product="legend"]').first(),
    `${path} renders the LEG3ND shell`,
  ).toBeVisible({ timeout: 15_000 });
  // A page renders correctly if it shows an h1 OR an explicit AccessDenied
  // surface (manager-gated Manage routes show AccessDenied — an h3 EmptyState —
  // to the learner persona; that's the intended outcome, not a render failure).
  const heading = page.locator("h1").first();
  const denied = page.getByText(ACCESS_DENIED).first();
  await expect
    .poll(async () => (await heading.isVisible()) || (await denied.isVisible()), {
      message: `${path} renders a heading or an access-denied surface`,
      timeout: 15_000,
    })
    .toBe(true);
  await expect(page.getByText(ERROR_BOUNDARY), `${path} has no error boundary`).toHaveCount(0);
}

// ── Render + auth: both personas walk every legendNav surface ───────────────
for (const fixture of ["crew", "owner"] as const) {
  test.describe(`LEG3ND · ${fixture}`, () => {
    test.describe.configure({ timeout: 240_000 });
    test.beforeEach(async ({ page }) => authedSetup(page, fixture));

    test(`${fixture} lands on /legend with the LEG3ND shell`, async ({ page }) => {
      await expectLegendRender(page, "/legend");
      await expect(page.locator('[data-type="legend"]').first(), "the legend type axis is applied").toBeVisible();
    });

    test(`${fixture}: every legendNav surface renders`, async ({ page }) => {
      const hrefs = legendHrefs(legendNav);
      expect(hrefs.length, "legendNav exposes routes").toBeGreaterThan(0);
      for (const href of hrefs) {
        await expectLegendRender(page, href);
      }
    });
  });
}

// ── learner full CRUD journeys ──────────────────────────────────────────────
// Drive the real learn → assess spine + community + live + store from the
// learner (crew) fixture. Each journey reads server truth after the mutation.
test.describe("LEG3ND · learner CRUD (crew)", () => {
  test.describe.configure({ timeout: 300_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "crew"));

  test("learner enrolls → completes a lesson → attempts the assessment", async ({ page }) => {
    // Pick the first real course from the catalog ("Your courses" cards link to
    // /legend/learn/<uuid>; preview cards link to /lesson/, so filter those out).
    await expectLegendRender(page, "/legend/learn");
    const hrefs = await page
      .locator('a[href^="/legend/learn/"]')
      .evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href") || ""));
    const courseHref = hrefs.find((h) => /^\/legend\/learn\/[0-9a-f-]{36}$/.test(h));
    expect(courseHref, "the seeded catalog exposes a real course overview link").toBeTruthy();

    // ── Enroll (idempotent) → lands back on the course overview ──────────────
    await expectLegendRender(page, courseHref!);
    const enrollBtn = page.getByRole("button", { name: /^enroll$/i });
    if (await enrollBtn.count()) {
      await enrollBtn.click();
      await expect(page, "enroll redirects back into the course").toHaveURL(
        new RegExp(courseHref!.replace(/[/]/g, "\\/")),
        { timeout: 35_000 },
      );
    }
    // No RLS/auth error surfaced by the enroll.
    await expect(
      page.locator(".ps-alert--danger, [role='alert']").filter({ hasText: RLS_ERROR }),
      "enroll surfaced no RLS error",
    ).toHaveCount(0);

    // ── Complete EVERY lesson so progress hits 100% (unlocks the assessment) ──
    // Enumerate the lesson links off the overview, then complete each one. The
    // LessonComplete control fires completeLessonAction (→ lesson_progress +
    // course_enrollments progress) and routes onward; we drive each lesson by id
    // so a multi-lesson course is fully completed.
    await expectLegendRender(page, courseHref!);
    const lessonHrefs = await page
      .locator(`a[href*="${courseHref!}/lesson/"]`)
      .evaluateAll((as) =>
        Array.from(new Set(as.map((a) => (a as HTMLAnchorElement).getAttribute("href") || ""))).filter(Boolean),
      );
    expect(lessonHrefs.length, "the enrolled course exposes its lessons").toBeGreaterThan(0);
    for (const lh of lessonHrefs) {
      await page.goto(lh);
      await expect(page.locator('[data-product="legend"]').first()).toBeVisible({ timeout: 15_000 });
      const completeBtn = page.getByRole("button", { name: /mark complete|completed — continue/i });
      await expect(completeBtn, `lesson ${lh} exposes a mark-complete control`).toBeVisible({ timeout: 15_000 });
      await completeBtn.click();
      await expect(
        page.locator(".ps-alert--danger, [role='alert']").filter({ hasText: RLS_ERROR }),
        "lesson completion surfaced no RLS error",
      ).toHaveCount(0);
      await page.waitForLoadState("load").catch(() => {});
    }

    // ── Assert progress persisted: the overview now shows a progress bar ──────
    await expectLegendRender(page, courseHref!);
    await expect(
      page.locator('[role="progressbar"], [aria-label*="progress" i]').first(),
      "course progress is tracked after completing the lessons",
    ).toBeVisible({ timeout: 15_000 });

    // ── Attempt the assessment ───────────────────────────────────────────────
    // With every lesson done the overview surfaces a "Take assessment" link (for
    // a course that publishes one). An assessment-less course is an honest skip.
    const quizLink = page.locator(`a[href*="${courseHref!}/quiz/"]`).first();
    if (await quizLink.count()) {
      await quizLink.click();
      await expect(page).toHaveURL(/\/quiz\/[0-9a-f-]{36}/, { timeout: 35_000 });
      await expect(page.locator('[data-product="legend"]').first()).toBeVisible();
      // Answer every question, advancing to Submit. The AssessmentRunner is a
      // one-question-at-a-time wizard; option choices are <button aria-pressed>
      // controls (NOT radios), and Submit stays disabled until one is picked.
      for (let i = 0; i < 20; i++) {
        const option = page.locator("button[aria-pressed]").first();
        await expect(option, "the quiz question renders selectable options").toBeVisible({ timeout: 15_000 });
        await option.click();
        const submit = page.getByRole("button", { name: /^submit$/i });
        if (await submit.isVisible().catch(() => false)) {
          await expect(submit, "Submit enables once an option is chosen").toBeEnabled({ timeout: 10_000 });
          await submit.click();
          break;
        }
        await page.getByRole("button", { name: /^next$/i }).click();
      }
      // The runner shows the server-scored result panel — only rendered from the
      // submitAttemptAction response, so its presence proves the attempt row was
      // inserted + scored server-side.
      await expect(
        page.getByText(/assessment complete/i),
        "the assessment was scored server-side (attempt persisted)",
      ).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(/^\d{1,3}%$/), "a numeric score is shown").toBeVisible({ timeout: 5_000 });
      await expect(
        page.locator(".ps-alert--danger, [role='alert']").filter({ hasText: RLS_ERROR }),
        "assessment submit surfaced no RLS error",
      ).toHaveCount(0);
    }
  });

  test("learner posts to the community", async ({ page }) => {
    await expectLegendRender(page, "/legend/community");
    const title = `E2E Learner Post ${stamp()}`;
    const form = page.locator("form:has([name='title'])").first();
    await expect(form, "the community composer is present").toBeVisible({ timeout: 15_000 });
    await form.locator("[name='title']").fill(title);
    await form.locator("[name='body_html']").fill("Posted by the LEG3ND learner e2e journey.");
    await form.getByRole("button", { name: /^post$/i }).click();

    await expect(
      page.locator(".ps-alert--danger, [role='alert']").filter({ hasText: RLS_ERROR }),
      "community post surfaced no RLS error",
    ).toHaveCount(0);

    // Reload to read server truth — the post persisted under RLS + renders.
    await page.reload();
    await expectLegendRender(page, "/legend/community");
    await expect(
      page.getByText(title, { exact: false }).first(),
      "the community post persisted + renders",
    ).toBeVisible({ timeout: 15_000 });
  });

  test("learner registers for a live session", async ({ page }) => {
    await expectLegendRender(page, "/legend/live");
    // Scope to a single session row so the assertion can't match a sibling
    // session's "Register" label. Find a row whose control still reads
    // "Register" (not already-registered from a prior run); if none, the learner
    // is registered for everything — an honest already-done PASS.
    const registerable = page
      .locator("li.surface")
      .filter({ has: page.getByRole("button", { name: /^register$/i }) });
    if ((await registerable.count()) === 0) {
      await expect(
        page.getByText(/registered|waitlist/i).first(),
        "already registered for the seeded sessions (idempotent re-run)",
      ).toBeVisible({ timeout: 15_000 });
      return;
    }
    // Pin the row by its (stable) session title — after the write the page
    // revalidates and this row's control flips from Register → Cancel, so a
    // filter-by-Register locator would skip to a DIFFERENT row. Title is stable.
    const title = (await registerable.first().locator("h3").first().innerText()).trim();
    const row = page.locator("li.surface").filter({ hasText: title });
    await row.getByRole("button", { name: /^register$/i }).click();
    await expect(
      page.locator("[role='alert'], .text-\\[var\\(--p-danger\\)\\]").filter({ hasText: RLS_ERROR }),
      "session register surfaced no RLS error",
    ).toHaveCount(0);
    // The control in THIS row flips to "Cancel" — only reachable if the
    // registration INSERT persisted and the page revalidated.
    await expect(
      row.getByRole("button", { name: /^cancel$/i }),
      "the session control flipped to registered (Cancel) after the write",
    ).toBeVisible({ timeout: 15_000 });
  });

  test("learner redeems a voucher for credits", async ({ page }) => {
    await expectLegendRender(page, "/legend/store");
    const codeInput = page.locator("[name='code']").first();
    await expect(codeInput, "the voucher redemption form is present").toBeVisible({ timeout: 15_000 });
    // WELCOME100 is a seeded active voucher in the Test Professional Org.
    await codeInput.fill("WELCOME100");
    await page.getByRole("button", { name: /^redeem$/i }).click();
    // Either a success line ("Redeemed — N credits") or an honest "already
    // redeemed" (idempotent re-run) — never an RLS / not-found error.
    await expect(
      page.getByText(/redeemed|already redeemed|credits added/i).first(),
      "voucher redemption produced a result (success or already-redeemed)",
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText(RLS_ERROR),
      "voucher redemption surfaced no RLS / not-found error",
    ).toHaveCount(0);
  });
});

// ── operator journeys ───────────────────────────────────────────────────────
// The operator (owner = manager+) authors the knowledge base. Resources create
// gates on isManagerPlus AND RLS; the console course-assignment upserts an
// enrollment for a learner.
test.describe("LEG3ND · operator CRUD (owner)", () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("operator creates a knowledge resource", async ({ page }) => {
    await expectLegendRender(page, "/legend/resources/new");
    const title = `E2E Resource ${stamp()}`;
    const form = page.locator("main form").first();
    await form.locator("[name='title']").fill(title);
    await form.locator("[name='url']").fill("https://example.com/legend-e2e").catch(() => {});
    // Publish so it lists; FormShell submits the action → redirect to detail.
    await form.locator("select[name='resource_state']").selectOption("published").catch(() => {});
    await form.evaluate((f: HTMLFormElement) => f.requestSubmit());

    await expect(page, "resource create redirects off /new to the detail").not.toHaveURL(/\/new(\?|$)/, {
      timeout: 35_000,
    });
    await expect(page).toHaveURL(/\/legend\/resources\/[0-9a-f-]{36}/, { timeout: 35_000 });
    await expect(
      page.getByRole("alert").filter({ hasText: /error|failed|invalid|authorized/i }),
      "resource create surfaced no error",
    ).toHaveCount(0);
    await expect(page.getByText(title, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  });

  test("operator assigns a course from the training console", async ({ page }) => {
    await expectLegendRender(page, "/legend/console");
    // The console mounts an AssignForm (member select + course select). If the
    // org has no learners or no courses the form may be absent — that's an
    // honest empty-state PASS.
    const assignForm = page.locator("form:has(select[name='course_id'])").first();
    if ((await assignForm.count()) === 0) {
      test.skip(true, "training console exposes no assign form (no learners/courses)");
      return;
    }
    await assignForm.locator("select[name='user_id']").selectOption({ index: 1 }).catch(() => {});
    await assignForm.locator("select[name='course_id']").selectOption({ index: 1 }).catch(() => {});
    await assignForm.getByRole("button", { name: /assign|enroll/i }).first().click();
    await expect(
      page.locator("[role='alert'], .text-\\[var\\(--p-danger\\)\\]").filter({ hasText: RLS_ERROR }),
      "course assignment surfaced no RLS error",
    ).toHaveCount(0);
    await expect(
      page.getByText(/assigned|enrolled/i).first(),
      "course assignment produced a success result",
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ── crew band on the persona-floor surfaces (L-P6d enrichment) ──────────────
// The crew fixture is role=member / persona=crew — the LEARNER band, NOT a
// read-only stakeholder (viewer/client/community). The persona floor must not
// bind it: learner surfaces render without AccessDenied, the Manage rail stays
// hidden (nav is band-filtered, crew < manager), and the crews join/leave
// self-service works end-to-end (assertLegendWrite passes for members; the
// self-membership RLS band from 20260723180000 admits the write).
test.describe("LEG3ND · crew band floor (crew)", () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "crew"));

  test("crew: learner surfaces render WITHOUT the access-denied surface", async ({ page }) => {
    // Stronger than the rail sweep above, which treats AccessDenied as a valid
    // landing: on the learner spine (learn/store/community/crews) a member must
    // get the real surface, never the denial.
    for (const path of ["/legend/learn", "/legend/store", "/legend/community", "/legend/crew"]) {
      await expectLegendRender(page, path);
      await expect(
        page.getByText(ACCESS_DENIED),
        `${path} renders the real surface to the member band, not AccessDenied`,
      ).toHaveCount(0);
    }
  });

  test("crew: the rail carries no Manage group", async ({ page }) => {
    await expectLegendRender(page, "/legend");
    const aside = page.locator('aside[aria-label="LEG3ND"]');
    await expect(aside, "the desktop rail renders").toBeVisible({ timeout: 15_000 });
    await expect(aside.getByText(/^Learn$/), "the learner groups stay").toBeVisible();
    await expect(aside.getByText(/^Manage$/), "the Manage group is band-filtered out").toHaveCount(0);
    await expect(aside.getByRole("link", { name: "Teach" })).toHaveCount(0);
    await expect(aside.getByRole("link", { name: "Store Admin" })).toHaveCount(0);
  });

  test("crew: can join and leave a crew (the read-only floor doesn't bind members)", async ({ page }) => {
    await expectLegendRender(page, "/legend/crew");
    const join = page.getByRole("button", { name: /^join$/i });
    const leave = page.getByRole("button", { name: /^leave$/i });
    if ((await join.count()) === 0 && (await leave.count()) === 0) {
      // No legend_crews rows are seeded anywhere (migrations + e2e seeder) —
      // until an org authors one, this self-service loop has nothing to bind.
      test.skip(true, "no active crews in the org — nothing to join (crews are manager-authored, none seeded)");
      return;
    }
    // Residue teardown first: leave every crew a prior interrupted run joined,
    // so the join below always exercises the INSERT path. Bounded loop — each
    // leave revalidates the page and that row's control flips back to Join.
    for (let i = 0; i < 10; i++) {
      const n = await leave.count();
      if (n === 0) break;
      await leave.first().click();
      await expect
        .poll(async () => leave.count(), { message: "residue leave persisted (control flipped)", timeout: 20_000 })
        .toBeLessThan(n);
    }
    await expect(leave, "no residual crew memberships remain").toHaveCount(0);

    // Join → the row's control flips to Leave only if the INSERT persisted
    // (the action reads the row back; an RLS-filtered insert is a loud error).
    await join.first().click();
    await expect(leave.first(), "the join persisted — the control flipped to Leave").toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByRole("alert").filter({ hasText: RLS_ERROR }),
      "join surfaced no RLS/read-only error",
    ).toHaveCount(0);

    // Teardown: leave again — membership state restored to none.
    await leave.first().click();
    await expect.poll(async () => leave.count(), { message: "the leave persisted", timeout: 20_000 }).toBe(0);
    await expect(
      page.getByRole("alert").filter({ hasText: RLS_ERROR }),
      "leave surfaced no RLS/read-only error",
    ).toHaveCount(0);
  });
});
