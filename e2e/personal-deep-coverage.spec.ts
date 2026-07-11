/**
 * Personal (/me) shell — DEEP self-service coverage.
 *
 * Deepens `e2e/personal-shell-personas.spec.ts` (which is a render sweep plus a
 * handful of upsert-in-place journeys: profile / preferences / talent / crew /
 * availability / saved-search-add). That spec deliberately stops at the honest
 * edges — its reviews test only asserts the querystring-less empty-state gate,
 * its saved-search test only asserts the ADD leg, and it never exercises the
 * marketplace INBOUND write loops at all.
 *
 * This file goes after the surfaces that spec leaves untested end-to-end:
 *   1. Reviews — the real insert path (createReview) from a job_application
 *      anchor, the one-review-per-reviewer-per-transaction duplicate guard, and
 *      the "not a party to it" transaction gate (resolveTransactionOrg → null).
 *   2. Open-call submissions — the submit side (open_call_submissions insert) +
 *      the submitter-scoped submission detail page.
 *   3. Applications — the applicant-scoping 404 on the detail page, and the
 *      booked-gate that hides the Write-A-Review CTA until job_application_state
 *      is 'booked'.
 *   4. Marketplace inquiries — the /me/inquiries create loop (submit_marketplace_inquiry).
 *   5. Saved searches — the invalid-JSON guard branch and the add→delete round-trip.
 *   6. Notification preferences — the notification_preferences.matrix per-kind Push toggle persists.
 *   7. Booking offers — the talent-side accept transition (acceptOfferAction:
 *      sent → accepted) on /me/offers, which no spec covers (only the studio-side
 *      offer machine is).
 *   8. Privacy — the self-service GDPR data export returns the caller's own data.
 *
 * Personas mirror the existing spec: `community` (marketplace-capable authed
 * user), `member` (plain authed user), `owner` (operator, seeds the offer), and
 * `developer` (user_id on the professional-org Fixture Band Alpha profile, so
 * the talent-side accept phase runs on ITS /me/offers).
 *
 * Idempotency: the review-write test self-heals by deleting its own prior review
 * (the reviewer may delete their own row under RLS — `reviews_delete`) so the
 * insert path always starts clean across re-runs; the submission / inquiry / apply
 * loops branch on their already-done terminal states; saved-search + offer tests
 * scope to a per-run stamp/date.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient as createSbClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "./helpers/base";
import { authedSetup, dismissConsent, fixtureEmail, loginAndSwitchWorkspace, loginAs, TEST_PASSWORD } from "./helpers/auth";
import { stamp } from "./helpers/forms";

// ── Durable fixtures (mirror e2e/helpers/fixtures.ts + marketplace_test_fixtures) ─
const PROF_ORG = "f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7";
const GIG_SLUG = "e2e-gig"; // JOB_POSTING_FIXTURE — a published gig the community persona can apply to
const CALL_SLUG = "fixture-festival-headliner-casting-pro"; // a published open call
const TALENT_HANDLE = "fixture-band-alpha-pro"; // Fixture Band Alpha public handle
const TALENT_PROFILE_ID = "aaaaaaaa-0001-4001-8001-000000000001"; // Fixture Band Alpha (professional org), user_id = test+developer
// A seeded job_application whose applicant is the OWNER fixture — a member must 404 on its detail.
const FOREIGN_APP_ID = "dddddddd-0001-4001-8001-000000000001";

const REVIEW_BANNER = /Review posted\. It stays hidden until the other side posts theirs/i;
const DUP_ERR = /already reviewed this transaction/i;
const NOT_A_PARTY_ERR = /couldn't find that transaction, or you're not a party to it/i;

// ── Best-effort review self-heal (reviewer may delete their own review) ─────────
function envVal(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  try {
    const txt = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    return txt.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();
  } catch {
    return undefined;
  }
}

/**
 * Delete any pre-existing review the given fixture user wrote for a transaction,
 * so the insert-path test starts clean on every re-run. Scoped to
 * reviewer_user_id = the caller's own uid (the `reviews_delete` RLS branch).
 * Never throws — on a truly fresh DB there's simply nothing to delete.
 */
async function purgeOwnReview(txType: string, txId: string, email: string): Promise<void> {
  try {
    const url = envVal("NEXT_PUBLIC_SUPABASE_URL");
    const anon = envVal("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    if (!url || !anon) return;
    const sb = createSbClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
    const { error: signErr } = await sb.auth.signInWithPassword({ email, password: TEST_PASSWORD });
    if (signErr) return;
    const { data: u } = await sb.auth.getUser();
    const uid = u.user?.id;
    if (uid) {
      await sb.from("reviews").delete().eq("transaction_type", txType).eq("transaction_id", txId).eq("reviewer_user_id", uid);
    }
    // Scope MUST be "local": the default signOut() scope is "global", which
    // revokes EVERY session for the user server-side, including the Playwright
    // page's cookie session. That's exactly what stranded the review-write test
    // on the sign-in page: the very next page.goto() failed the middleware's
    // getUser() check and bounced to /login.
    await sb.auth.signOut({ scope: "local" });
  } catch {
    /* best-effort hygiene — a green run is never turned red by cleanup */
  }
}

// ── Shared journey helpers ──────────────────────────────────────────────────
/**
 * Ensure the acting user has a live application to the e2e-gig posting, then
 * return that application's id. Applies only if the apply form is still showing
 * (the duplicate guard makes re-runs render the "Already Applied" terminal state).
 */
async function ensureAppliedGetId(page: Page): Promise<string> {
  await page.goto(`/marketplace/gigs/${GIG_SLUG}/apply`);
  const cover = page.locator('textarea[name="cover_note"]');
  if (await cover.count()) {
    await cover.fill(`E2E cover note ${stamp()} · relevant credits, available for the run.`);
    await page.getByRole("button", { name: /Submit Application/i }).click();
    await page.waitForURL(/\/me\/applications/, { timeout: 30_000 });
  }
  await page.goto("/me/applications");
  const link = page.locator('a[href^="/me/applications/"]').filter({ hasText: /E2E Gig/i }).first();
  await expect(link, "the e2e-gig application row is present").toBeVisible({ timeout: 15_000 });
  const href = await link.getAttribute("href");
  const id = (href ?? "").split("/").filter(Boolean).pop() ?? "";
  expect(id, "captured a non-empty application id").toMatch(/[0-9a-f-]{8,}/i);
  return id;
}

function reviewNewUrl(appId: string): string {
  return `/me/reviews/new?transactionType=job_application&transactionId=${appId}&subjectType=org&subjectId=${PROF_ORG}`;
}

/**
 * Fill + Post Review on the composed reviews/new form, then wait for a
 * DETERMINISTIC settle: either the success banner (redirect to
 * /me/reviews?reviewed=1) or the inline duplicate-guard error. The old
 * waitForLoadState("load") sniff resolved before the server-action redirect
 * landed, so callers read a stale page.url() and skipped/duplicated posts.
 * `.first()` because error copy renders twice (inline alert + the sr-only
 * aria-live announcer).
 */
async function postReview(page: Page, appId: string): Promise<void> {
  await page.goto(reviewNewUrl(appId));
  await expect(page.getByRole("button", { name: /Post Review/i })).toBeVisible({ timeout: 15_000 });
  await page.locator('textarea[name="body"]').fill(`E2E review ${stamp()} · great working relationship.`);
  await page.getByRole("button", { name: /Post Review/i }).click();
  await expect(
    page.getByText(REVIEW_BANNER).or(page.getByText(DUP_ERR)).first(),
    "the post settled on the success banner or the duplicate-guard error",
  ).toBeVisible({ timeout: 30_000 });
}

// ════════════════════════════════════════════════════════════════════════════
// Reviews — the real insert path, the duplicate guard, and the party gate
// ════════════════════════════════════════════════════════════════════════════
test.describe("personal /me deep · reviews (community)", () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "community"));

  test("review write end-to-end from a job_application anchor → posted banner", async ({ page }) => {
    const appId = await ensureAppliedGetId(page);
    // Start clean so the insert path (not the duplicate guard) is what's exercised.
    await purgeOwnReview("job_application", appId, fixtureEmail("community"));

    await page.goto(reviewNewUrl(appId));
    await expect(page.getByRole("button", { name: /Post Review/i }), "the composed form renders").toBeVisible({
      timeout: 15_000,
    });
    await page.locator('textarea[name="body"]').fill("E2E review · clear comms, would work together again.");
    await page.getByRole("button", { name: /Post Review/i }).click();

    // createReview inserted the row + redirect("/me/reviews?reviewed=1").
    await page.waitForURL(/\/me\/reviews\?reviewed=1/, { timeout: 30_000 });
    await expect(page.getByText(REVIEW_BANNER), "the posted-review success banner is shown").toBeVisible({
      timeout: 15_000,
    });
  });

  test("duplicate guard rejects a second review for the same transaction", async ({ page }) => {
    // Self-contained: does NOT depend on the previous test having posted; the
    // first postReview below creates the row itself when none exists yet.
    const appId = await ensureAppliedGetId(page);
    // Post once. postReview settles deterministically, so page.url() is now
    // truthful: reviewed=1 means the first post CREATED the row (fresh DB);
    // otherwise the first post was itself the duplicate and the error is up.
    await postReview(page, appId);
    if (page.url().includes("reviewed=1")) {
      await postReview(page, appId);
    }
    await expect(page, "a duplicate review does NOT redirect to the posted state").not.toHaveURL(/reviewed=1/);
    await expect(
      page.getByText(DUP_ERR).first(),
      "the one-review-per-reviewer-per-transaction guard surfaces its error",
    ).toBeVisible({ timeout: 15_000 });
  });

  test("application detail hides the Write-A-Review CTA until booked", async ({ page }) => {
    const appId = await ensureAppliedGetId(page);
    await page.goto(`/me/applications/${appId}`);
    // The seeded application is 'submitted', not 'booked'.
    await expect(page.getByText("Cover note", { exact: true }), "the cover-note card renders").toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("link", { name: /Write A Review/i }),
      "the review CTA is gated behind job_application_state === 'booked'",
    ).toHaveCount(0);
    await expect(
      page.locator('a[href*="/me/reviews/new"]'),
      "no review anchor link leaks on a non-booked application",
    ).toHaveCount(0);
  });
});

test.describe("personal /me deep · reviews party gate (member)", () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "member"));

  test("review action blocks anchoring to a transaction you are not a party to", async ({ page }) => {
    // Complete querystring → the real form renders; the write is where the gate bites.
    await page.goto(
      "/me/reviews/new?transactionType=job_application&transactionId=00000000-0000-4000-8000-0000000000fe&subjectType=org&subjectId=00000000-0000-4000-8000-0000000000ff",
    );
    await expect(page.getByRole("button", { name: /Post Review/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Post Review/i }).click();

    await expect(page, "a blocked review never reaches the posted state").not.toHaveURL(/reviewed=1/);
    // .first(): the error renders twice (inline alert + sr-only aria-live announcer).
    await expect(
      page.getByText(NOT_A_PARTY_ERR).first(),
      "resolveTransactionOrg → null (RLS hides the row) surfaces the party gate",
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Open-call submissions — the submit side + the submitter-scoped detail
// ════════════════════════════════════════════════════════════════════════════
test.describe("personal /me deep · open-call submissions (community)", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "community"));

  test("submit → My Submissions → submission detail", async ({ page }) => {
    await page.goto(`/marketplace/calls/${CALL_SLUG}/submit`);
    const pitch = page.locator('textarea[name="cover_note"]');
    const submitted = await pitch.count();
    let coverText = "";
    if (submitted) {
      coverText = `E2E open-call pitch ${stamp()} · I fit this brief because reasons.`;
      await pitch.fill(coverText);
      // MultiStepForm: Pitch → Links → Review → Submit. The footer button DOM
      // node is REUSED across steps (React flips the same <button> from Next to
      // Submit in place), so a Next click can race the re-render and land as the
      // submit itself. Await each step's content before advancing, and treat the
      // final waitForURL (not the click) as the source of truth.
      await page.getByRole("button", { name: /^Next$/ }).click();
      await expect(page.locator('textarea[name="links"]'), "the Links step is active").toBeVisible({
        timeout: 15_000,
      });
      await page.getByRole("button", { name: /^Next$/ }).click();
      const submitBtn = page.getByRole("button", { name: /Submit To This Call/i });
      try {
        await submitBtn.waitFor({ state: "visible", timeout: 15_000 });
        if (await submitBtn.isEnabled()) await submitBtn.click({ timeout: 15_000 });
      } catch {
        // The Next→Submit node swap raced the click and the form already
        // submitted (button disabled/aria-busy, then detached on redirect).
        // The URL wait below verifies the outcome either way.
      }
      await page.waitForURL(/\/me\/submissions\?submitted=1/, { timeout: 30_000 });
      await expect(page.getByText(/Submission received/i), "the submission-received banner shows").toBeVisible({
        timeout: 15_000,
      });
    } else {
      // Re-run: the already-submitted terminal state links back to My Submissions.
      await page.getByRole("link", { name: /View My Submissions/i }).click();
      await page.waitForURL(/\/me\/submissions/, { timeout: 15_000 });
    }

    // Open the (only) submission's detail — submitter-scoped read.
    const link = page.locator('a[href^="/me/submissions/"]').first();
    await expect(link, "a submission row is present").toBeVisible({ timeout: 15_000 });
    await link.click();
    await page.waitForURL(/\/me\/submissions\/[0-9a-f-]+/, { timeout: 15_000 });
    await expect(page.locator("main h1, h1").filter({ hasText: /^#/ }).first(), "detail renders the #id heading").toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Cover note", { exact: true }), "detail renders the cover-note card").toBeVisible({
      timeout: 15_000,
    });
    if (submitted) {
      await expect(page.getByText(coverText), "the submitted cover note is bound onto the detail").toBeVisible({
        timeout: 15_000,
      });
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Applications — applicant-scoping on the detail page
// ════════════════════════════════════════════════════════════════════════════
test.describe("personal /me deep · application scoping (member)", () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "member"));

  test("a foreign application's detail 404s (applicant-scoped)", async ({ page }) => {
    await page.goto(`/me/applications/${FOREIGN_APP_ID}`);
    // The .eq('applicant_user_id', session.userId) filter yields no row → notFound().
    // NOT asserted via HTTP status: Next streams the (personal) layout shell
    // first, so the response commits as 200 before notFound() throws; the
    // not-found boundary then renders in-stream. Assert the boundary UI
    // (src/app/(personal)/not-found.tsx) instead.
    await expect(
      page.getByRole("heading", { name: /Page Not Found/i }),
      "the (personal) not-found boundary renders for a non-owned application id",
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(/Fixture cover note/i),
      "the foreign applicant's cover note never renders for a non-party",
    ).toHaveCount(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Marketplace inquiries — the /me/inquiries create loop
// ════════════════════════════════════════════════════════════════════════════
test.describe("personal /me deep · inquiries (community)", () => {
  test.describe.configure({ timeout: 150_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "community"));

  test("send a talent inquiry → My Inquiries", async ({ page }) => {
    await page.goto(`/marketplace/talent/${TALENT_HANDLE}/inquire`);
    const message = page.locator('textarea[name="message"]');
    if (await message.count()) {
      await message.fill(`E2E booking inquiry ${stamp()} · dates, scope, and budget band inside.`);
      await page.getByRole("button", { name: /Send Inquiry/i }).click();
      await page.waitForURL(/\/me\/inquiries\?sent=1/, { timeout: 30_000 });
      await expect(page.getByText(/Inquiry sent/i), "the inquiry-sent banner shows").toBeVisible({ timeout: 15_000 });
    } else {
      // Re-run: the "Inquiry Already Sent" terminal state links to My Inquiries.
      await page.getByRole("link", { name: /View My Inquiries/i }).click();
      await page.waitForURL(/\/me\/inquiries/, { timeout: 15_000 });
    }
    await expect(
      page.getByRole("link", { name: /Fixture Band Alpha/i }),
      "the inquiry row links back to the talent subject",
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Saved searches — the JSON guard branch + the add→delete round-trip
// ════════════════════════════════════════════════════════════════════════════
test.describe("personal /me deep · saved searches (member)", () => {
  test.describe.configure({ timeout: 150_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "member"));

  test("invalid JSON in the query field is rejected", async ({ page }) => {
    await page.goto("/me/saved-searches");
    const form = page.locator("form").filter({ has: page.locator('textarea[name="query"]') }).first();
    await expect(form, "the add-subscription form renders").toBeVisible({ timeout: 15_000 });
    const badName = `E2E Bad JSON ${stamp()}`;
    await form.locator('select[name="kind"]').selectOption("gig");
    await form.locator('input[name="name"]').fill(badName);
    await form.locator('textarea[name="query"]').fill("{not valid json");
    await form.evaluate((f: HTMLFormElement) => f.requestSubmit());

    // .first(): the error renders twice (inline alert + sr-only aria-live announcer).
    await expect(
      page.getByText("Query must be valid JSON").first(),
      "the JSON.parse guard surfaces its error",
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.locator("li").filter({ hasText: badName }),
      "no saved-search row was created for the invalid input",
    ).toHaveCount(0);
  });

  test("add → delete round-trip", async ({ page }) => {
    await page.goto("/me/saved-searches");
    const form = page.locator("form").filter({ has: page.locator('textarea[name="query"]') }).first();
    const name = `E2E Search ${stamp()}`;
    await form.locator('select[name="kind"]').selectOption("crew");
    await form.locator('input[name="name"]').fill(name);
    await form.locator('textarea[name="query"]').fill('{"city":"Atlanta"}');
    await form.evaluate((f: HTMLFormElement) => f.requestSubmit());

    // Read server truth — the row persisted.
    await page.reload();
    const row = page.locator("li").filter({ hasText: name }).first();
    await expect(row, "the saved search persisted after add").toBeVisible({ timeout: 15_000 });

    // Delete leg — the per-row Remove fires deleteSavedSearchAction(search_id).
    await row.getByRole("button", { name: /Remove/i }).click();
    await page.reload();
    await expect(
      page.locator("li").filter({ hasText: name }),
      "the saved search is gone after Remove",
    ).toHaveCount(0, { timeout: 15_000 });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Notification preferences — the notification_preferences.matrix per-kind
// Push toggle persists (NotifPrefsMatrix: kind rows × Push / In-app columns;
// each Push cell saves optimistically via a server action, no Save button).
// ════════════════════════════════════════════════════════════════════════════
test.describe("personal /me deep · notification prefs (member)", () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "member"));

  test("toggling a kind's Push cell persists across reload", async ({ page }) => {
    await page.goto("/me/notifications");
    // Matrix chrome: the Event / Push / In-app column headers render.
    await expect(
      page.getByRole("columnheader", { name: "Push" }),
      "the Push column header renders",
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("columnheader", { name: "In-app" }),
      "the In-app column header renders",
    ).toBeVisible();

    // Every Push cell carries aria-label "<Kind label> via Push" (the
    // viaTemplate). Target the first kind row's Push checkbox.
    const cell = page.getByRole("checkbox", { name: /via Push$/ }).first();
    await expect(cell, "a Push matrix cell renders").toBeVisible({ timeout: 15_000 });
    // The In-app column is always-on and read-only.
    const inApp = page.getByRole("checkbox", { name: /via In-app$/ }).first();
    await expect(inApp, "the In-app cell is always-on").toBeChecked();
    await expect(inApp, "the In-app cell is read-only").toBeDisabled();

    const before = await cell.isChecked();
    // Flip to the opposite of whatever is persisted — idempotent across
    // re-runs. The toggle is optimistic and fires its server action
    // immediately; wait for the action POST to settle so the upsert lands
    // BEFORE the reload below reads it back.
    const actionSettled = page.waitForResponse(
      (r) => r.request().method() === "POST" && r.url().includes("/me/notifications"),
      { timeout: 15_000 },
    );
    await cell.click();
    await expect(cell, "the cell flipped optimistically").toBeChecked({ checked: !before });
    await actionSettled;

    await page.reload();
    const cellAfter = page.getByRole("checkbox", { name: /via Push$/ }).first();
    await expect(cellAfter, "the matrix cell re-renders").toBeVisible({ timeout: 15_000 });
    await expect(cellAfter, "the toggled state persisted").toBeChecked({ checked: !before });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Booking offers — the talent-side accept transition (sent → accepted)
// ════════════════════════════════════════════════════════════════════════════
test.describe("personal /me deep · booking offers (owner)", () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ page }) => {
    // /studio visits: suppress the first-run ConsoleTour scrim before auth.
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("atlvs.tour.console.v1", "done");
      } catch {
        /* ignore */
      }
    });
    await dismissConsent(page);
    // Fixture Band Alpha lives in the professional org; lock the workspace so the
    // studio offer form lists it; the /me/offers accept phase re-logs-in as developer (the profile owner).
    await loginAndSwitchWorkspace(page, "owner", PROF_ORG);
  });

  test("talent accepts a sent booking offer (sent → accepted)", async ({ page }) => {
    // Seed a FRESH sent offer to the owner's own act via the studio machine
    // (never mutate the shared FX.offer — prior runs may have decided it). A
    // unique far-future performance_date is the row handle on /me/offers.
    const perfDate = new Date(Date.now() + (4000 + (Date.now() % 3000)) * 86_400_000).toISOString().slice(0, 10);
    // /me/offers never prints the ISO date; it renders
    // fmt.date(`${perfDate}T12:00:00Z`, "long") (Intl dateStyle:"long", locale
    // "en" → e.g. "July 25, 2038"). Match the rendered label, not the ISO
    // string (the ISO handle was the deep-e2e-rerun failure: row never found).
    const perfDateLabel = new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(
      new Date(`${perfDate}T12:00:00Z`),
    );

    await page.goto("/studio/marketplace/offers/new");
    await page.locator('select[name="talent_profile_id"]').selectOption(TALENT_PROFILE_ID);
    await page.locator('input[name="performance_date"]').fill(perfDate);
    // name= selector, NOT getByLabel("Fee"): getByLabel substring-matches the
    // Next dev-overlay's region aria-label "Error feedback" ("...fee..."), which
    // trips strict mode whenever the dev-tools error indicator is present.
    await page.locator('input[name="fee"]').fill("4200");
    await page.getByRole("button", { name: /^Save Draft$/i }).click();
    // 90s: the createOfferAction round-trip lands on the offers/[offerId]
    // detail route, whose first compile on a cold dev server has blown the old
    // 30s budget (deep-e2e-rerun failure 13, attempt 1; the retry was warm and
    // sailed through). A ceiling, not a delay: warm runs return in ~1s.
    await page.waitForURL(/\/studio\/marketplace\/offers\/[0-9a-f-]+$/, { timeout: 90_000 });
    await page.getByRole("button", { name: /Send Offer/i }).click();
    await page.waitForLoadState("load");
    await expect(page.getByText("sent").first(), "the seeded offer is now sent").toBeVisible({ timeout: 15_000 });

    // Talent-side accept on /me/offers. The professional-org Fixture Band Alpha
    // profile carries user_id = test+developer (NOT test+owner — verified live),
    // and /me/offers scopes to talent_profiles.user_id = session user. So the
    // accept phase must run as the profile's actual owner: re-login as developer.
    await loginAs(page, "developer");
    await page.goto("/me/offers");
    const row = page.locator("li").filter({ hasText: perfDateLabel }).first();
    await expect(row, "the sent offer surfaces on /me/offers").toBeVisible({ timeout: 15_000 });
    await expect(row.getByRole("button", { name: /^Accept$/i }), "the Accept control shows for a sent offer").toBeVisible();
    // Accepting is a binding commitment, so MyOfferActions interposes a
    // confirmation alertdialog. The row button only OPENS it; the real
    // acceptOfferAction fires from the dialog's "Accept Offer" CTA.
    await row.getByRole("button", { name: /^Accept$/i }).click();
    const confirm = page.getByRole("alertdialog");
    await expect(confirm, "the accept confirmation sheet opens").toBeVisible({ timeout: 15_000 });
    await confirm.getByRole("button", { name: /^Accept Offer$/i }).click();
    // decide() requires the SERVICE client (the state-machine UPDATE runs on
    // createServiceClient), so on a target without SUPABASE_SERVICE_ROLE_KEY
    // it deliberately returns "Offer decisions are not available in this
    // environment" and the dialog stays open. Detect that exact copy and skip
    // loudly; on a real target (prod E2E_BASE_URL) the key exists and the
    // dialog-close wait is the success signal.
    const envBlocked = page.getByText(/not available in this environment/i).first();
    await Promise.race([
      confirm.waitFor({ state: "hidden", timeout: 20_000 }),
      envBlocked.waitFor({ state: "visible", timeout: 20_000 }),
    ]).catch(() => {});
    test.skip(
      await envBlocked.isVisible().catch(() => false),
      "SUPABASE_SERVICE_ROLE_KEY absent locally: offer decisions are service-client-gated in this env",
    );
    // On success the action state flips ok and the dialog closes; on any other
    // error it stays open (the error surfaces as a toast), so this fails loudly.
    await expect(confirm, "the accept action committed (dialog closed)").toBeHidden({ timeout: 5_000 });

    // Read server truth — the transition flipped and the controls are gone.
    await page.reload();
    const row2 = page.locator("li").filter({ hasText: perfDateLabel }).first();
    await expect(row2, "the offer row is still present after accept").toBeVisible({ timeout: 15_000 });
    await expect(row2.getByText(/Accepted/i), "the offer badge reads Accepted").toBeVisible({ timeout: 15_000 });
    await expect(
      row2.getByRole("button", { name: /^Accept$/i }),
      "the Accept/Decline controls are gone once decided",
    ).toHaveCount(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Privacy — the self-service GDPR data export returns the caller's own data
// ════════════════════════════════════════════════════════════════════════════
test.describe("personal /me deep · privacy export (member)", () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "member"));

  test("data export returns the caller's own scoped bundle", async ({ page }) => {
    await page.goto("/me/privacy");
    await expect(page.getByText("Export My Data", { exact: true }), "the export card renders").toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: /^Download$/i }), "the export Download control renders").toBeVisible();

    // Exercise the endpoint the Download button hits — the page's authed cookies
    // ride along on page.request.
    const res = await page.request.get("/api/v1/me/export");
    expect(res.status(), "the export responds 200 for the authed caller").toBe(200);
    expect(res.headers()["content-type"] ?? "", "the export is JSON").toContain("application/json");

    const bundle = (await res.json()) as {
      user?: { id?: string; email?: string };
      users?: Array<{ id?: string }>;
    };
    expect(bundle.user?.email, "the bundle is scoped to the caller").toBe(fixtureEmail("member"));
    // users is filtered by id = the caller — at most their own row, no one else's.
    expect(Array.isArray(bundle.users), "the export carries a users array").toBeTruthy();
    expect((bundle.users ?? []).length, "the export never leaks other users' rows").toBeLessThanOrEqual(1);
    if ((bundle.users ?? []).length === 1) {
      expect(bundle.users?.[0]?.id, "the single users row is the caller's own").toBe(bundle.user?.id);
    }
  });
});
