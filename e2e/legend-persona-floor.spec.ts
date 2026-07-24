/**
 * LEG3ND persona floor (L-P6d) — the three coverage holes the readiness
 * matrix flagged at zero: the ANON public funnel, the anonymous certificate
 * verification surface, and the READ-ONLY stakeholder floor.
 *
 * Contract under test (src/lib/legend_access.ts + the (legend) layout):
 *
 *   • ANON — the shell layout does NOT blanket-gate on a session: /legend
 *     (landing) and /legend/learn (sample-preview funnel) render for
 *     logged-out visitors; the authed surfaces (/legend/hub, /legend/teach)
 *     bounce anon to /login via requireSession().
 *   • CERT VERIFY — /legend/certifications/[holderId]/verify resolves through
 *     the anon-callable `verify_certification` SECURITY DEFINER RPC. No
 *     certification_holders row is seeded anywhere (checked: migrations +
 *     scripts/seed-e2e-fixtures.mjs), so this spec covers the RPC's NEGATIVE
 *     path honestly: an unknown-but-well-formed holder id → notFound() → the
 *     LEG3ND 404 boundary, and a malformed id short-circuits the same way.
 *   • READ-ONLY FLOOR — personas viewer/client/community (entitlements `ro`)
 *     browse every learner surface but every learner write refuses at the
 *     action boundary (assertLegendWrite → the `auth.read-only.legend` code,
 *     rendered as READ_ONLY_COPY below). RLS deliberately does NOT enforce
 *     this (learner writes are membership-banded), so the refusal alert is
 *     the entire persona contract — these attempts write nothing by design.
 *     Crews' join/leave controls are HIDDEN for read-only personas (the one
 *     control the page conceals rather than letting the action refuse).
 *   • NAV FILTERING — the Manage group's items all carry minRole:"manager",
 *     so filterNavByRole strips the whole group from the member-band rail;
 *     owner keeps all seven Manage entries.
 *   • DENIAL CONSISTENCY — the member band hitting a Manage URL directly gets
 *     the page-gated AccessDenied EmptyState (never a form whose action would
 *     refuse later, never an error boundary).
 *
 * Fixtures: `viewer` and `community` exist in scripts/seed-e2e-fixtures.mjs
 * (role=member with the granular persona; the seeder reconciles drifted rows).
 * Both are pinned to the Test Professional Org via loginAndSwitchWorkspace so
 * the persona resolves from the org whose membership actually carries it — a
 * plain login could land on a different workspace where the suffix persona
 * doesn't apply (the known multi-org fixture-drift trap). If a refusal
 * assertion fails with a SUCCESSFUL write, reseed the fixtures (persona
 * drift), don't weaken the assertion.
 */
import { expect, test, type Page } from "./helpers/base";
import { authedSetup, dismissConsent, loginAndSwitchWorkspace } from "./helpers/auth";
import { stamp } from "./helpers/forms";
import { TEST_ORGS } from "./helpers/fixtures";

const ERROR_BOUNDARY = /application error|something went wrong|unhandled|digest:|client-side exception/i;
/** AccessDenied EmptyState title (src/components/ui/AccessDenied.tsx). */
const ACCESS_DENIED = /you don'?t have access/i;
/**
 * The exact rendered copy of the `auth.read-only.legend` action-error code
 * (src/lib/errors.ts ACTION_ERROR_FALLBACKS === src/messages/en.json
 * errors["auth"]["read-only"].legend, locked by errors-canon.test.ts). The
 * sentinel `@err:auth.read-only.legend` travels over the wire; the client
 * resolves it to this string.
 */
const READ_ONLY_COPY = "Your access is read-only. Ask an org admin for member access to participate.";

/** The desktop LEG3ND rail (LegendSidebar `<aside aria-label="LEG3ND">`). */
function rail(page: Page) {
  return page.locator('aside[aria-label="LEG3ND"]');
}

/** Strict learner render: LEG3ND shell + h1, NOT bounced, NOT access-denied. */
async function expectLearnerRender(page: Page, path: string): Promise<void> {
  const r = await page.goto(path);
  expect(r?.status() ?? 0, `${path} should not be a 5xx`).toBeLessThan(500);
  expect(page.url(), `${path} must not bounce to /login`).not.toMatch(/\/login/);
  await expect(
    page.locator('[data-product="legend"]').first(),
    `${path} renders the LEG3ND shell`,
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("h1").first(), `${path} renders its heading`).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByText(ACCESS_DENIED),
    `${path} is a learner surface — read-only personas browse it, no AccessDenied`,
  ).toHaveCount(0);
  await expect(page.getByText(ERROR_BOUNDARY), `${path} has no error boundary`).toHaveCount(0);
}

// ── 1 · ANON funnel ─────────────────────────────────────────────────────────
test.describe("LEG3ND · anon funnel", () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ page }) => dismissConsent(page));

  test("anon: /legend renders the marketing product page (shell normalization)", async ({ page }) => {
    // Since the 2026-07-24 shell normalization the bare /legend path is the
    // (marketing) shell's LEG3ND product page — matching /atlvs, /compvss,
    // /gvteway. The app home moved to /legend/hub; the public app funnel
    // (learn, for-institutions, certificate verify) is covered below.
    const r = await page.goto("/legend");
    expect(r?.status() ?? 0).toBeLessThan(500);
    expect(page.url(), "the product page is public — no login bounce").not.toMatch(/\/login/);
    await expect(page.locator('[data-platform="legend"]').first(), "the LEG3ND accent scope paints").toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator("h1").first(), "the hero heading renders").toBeVisible({ timeout: 15_000 });
    // The product page funnels into the public course catalog. href tolerates
    // both URL modes (subdomain: https://legend…/learn · path-prefix:
    // /legend/learn) — match on the suffix.
    await expect(
      page.locator('a[href$="/learn"]').first(),
      "the product page links into the course funnel",
    ).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  });

  test("anon: /legend/learn renders the sample-preview funnel (no learner data)", async ({ page }) => {
    const r = await page.goto("/legend/learn");
    expect(r?.status() ?? 0).toBeLessThan(500);
    expect(page.url(), "the catalog is the public funnel — no login bounce").not.toMatch(/\/login/);
    await expect(page.locator('[data-product="legend"]').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("h1").first(), "the catalog heading renders").toBeVisible({ timeout: 15_000 });
    // The anon funnel = the self-contained preview courses, whose cards deep-link
    // straight into a sample lesson (/legend/learn/<slug>/lesson/<id>).
    const previews = page.locator('main a[href*="/lesson/"]');
    expect(await previews.count(), "the sample preview cards render for anon").toBeGreaterThan(0);
    // The authed-only "Your courses" section never renders without a session.
    await expect(
      page.getByText(/^your courses$/i),
      "anon sees no live enrollment section",
    ).toHaveCount(0);
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  });

  test("anon: manage + org-scoped surfaces bounce to login", async ({ page }) => {
    // A Manage route (page-level requireSession before the manager gate).
    await page.goto("/legend/teach");
    await page.waitForURL(/\/login/, { timeout: 30_000 });
    expect(page.url(), "/legend/teach requires a session").toMatch(/\/login/);
    // The org hub (the org-scoped configuration surface).
    await page.goto("/legend/hub");
    await page.waitForURL(/\/login/, { timeout: 30_000 });
    expect(page.url(), "/legend/hub requires a session").toMatch(/\/login/);
  });

  test("anon: certificate verification answers an unknown record honestly (RPC negative path)", async ({ page }) => {
    // No certification_holders row is seeded (migrations + e2e seeder checked),
    // so cover the negative path: a well-formed uuid the verify_certification
    // RPC cannot answer → notFound() → the LEG3ND 404 boundary, inside the
    // shell (anonymously — this page never requires a session).
    const bogus = "00000000-0000-4000-8000-00000000dead";
    await page.goto(`/legend/certifications/${bogus}/verify`);
    // Streaming (the shell's loading boundary) commits a 200 before notFound()
    // throws, so the honest signal is the RENDERED not-found — never a leak,
    // never an error boundary.
    await expect(
      page.getByRole("heading", { name: "Not Found" }),
      "an unknown holder id renders the shell 404, not an error or a leak",
    ).toBeVisible({ timeout: 15_000 });
    expect(page.url(), "no login bounce — verification is anon-callable").not.toMatch(/\/login/);
    await expect(page.locator('[data-product="legend"]').first(), "404 renders inside the shell").toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/not found/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);

    // A malformed id short-circuits before the RPC — same honest 404.
    await page.goto("/legend/certifications/not-a-uuid/verify");
    await expect(
      page.getByRole("heading", { name: "Not Found" }),
      "a malformed holder id renders the shell 404",
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ── 2 · READ-ONLY floor: viewer ─────────────────────────────────────────────
test.describe("LEG3ND · read-only floor (viewer)", () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "viewer", TEST_ORGS.professional);
  });

  test("viewer: learner surfaces render read-only and the rail hides Manage", async ({ page }) => {
    for (const path of ["/legend/learn", "/legend/store", "/legend/community", "/legend/leaderboard"]) {
      await expectLearnerRender(page, path);
    }
    // Nav filtering (P-3): the Manage group is band-stripped for role=member.
    const aside = rail(page);
    await expect(aside, "the desktop rail renders").toBeVisible();
    await expect(aside.getByText(/^Learn$/), "the learner groups stay").toBeVisible();
    await expect(aside.getByText(/^Manage$/), "no Manage group for the member band").toHaveCount(0);
    await expect(aside.getByRole("link", { name: "Teach" })).toHaveCount(0);
    await expect(aside.getByRole("link", { name: "Store Admin" })).toHaveCount(0);
  });

  test("viewer: enroll refuses with the read-only copy (nothing written)", async ({ page }) => {
    await expectLearnerRender(page, "/legend/learn");
    // Pick the first REAL course (uuid overview link; preview cards link /lesson/).
    const hrefs = await page
      .locator('a[href^="/legend/learn/"]')
      .evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href") || ""));
    const courseHrefs = hrefs.filter((h) => /^\/legend\/learn\/[0-9a-f-]{36}$/.test(h));
    expect(courseHrefs.length, "the seeded catalog exposes real courses").toBeGreaterThan(0);

    // A clean viewer can never be enrolled (the enroll action refuses
    // pre-insert), so some course must offer Enroll. Guard against historical
    // residue: a pre-persona-reconcile run could have enrolled this fixture
    // while it drifted to plain member — walk the catalog for an Enroll.
    let courseHref: string | null = null;
    for (const h of courseHrefs) {
      await expectLearnerRender(page, h);
      if (await page.getByRole("button", { name: /^enroll$/i }).count()) {
        courseHref = h;
        break;
      }
    }
    if (!courseHref) {
      test.skip(
        true,
        "every seeded course carries a residue enrollment for the viewer fixture — reseed (persona drift residue), the floor itself is untestable here",
      );
      return;
    }
    const enroll = page.getByRole("button", { name: /^enroll$/i });
    await expect(enroll, "the enroll control renders (floor is action-enforced)").toBeVisible({ timeout: 15_000 });
    await enroll.click();
    await expect(
      page.getByRole("alert").filter({ hasText: READ_ONLY_COPY }),
      "enroll refused with the canonical read-only denial",
    ).toBeVisible({ timeout: 20_000 });
    // The action returned the denial BEFORE its redirect — still on the course.
    expect(page.url()).toContain(courseHref!);
  });

  test("viewer: store + community writes refuse; crews hide join", async ({ page }) => {
    // Store — the voucher form renders for everyone; the WRITE refuses at the
    // action boundary before the redeem RPC (the seeded voucher is untouched).
    await expectLearnerRender(page, "/legend/store");
    const code = page.locator("[name='code']").first();
    await expect(code, "the voucher form renders (floor is action-enforced)").toBeVisible({ timeout: 15_000 });
    await code.fill("WELCOME100");
    await page.getByRole("button", { name: /^redeem$/i }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: READ_ONLY_COPY }),
      "voucher redemption refused with the canonical read-only denial",
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/redeemed:/i), "no credits were granted").toHaveCount(0);

    // Community — the composer renders; the post refuses; nothing persists.
    // Title uses the teardown-matched "E2E Legend Post" prefix defensively —
    // if the floor ever regressed, e2e:clean would purge the leak.
    await expectLearnerRender(page, "/legend/community");
    const title = `E2E Legend Post RO ${stamp()}`;
    const composer = page.locator("form:has([name='title'])").first();
    await expect(composer, "the composer renders (floor is action-enforced)").toBeVisible({ timeout: 15_000 });
    await composer.locator("[name='title']").fill(title);
    await composer.getByRole("button", { name: /^post$/i }).click();
    await expect(
      composer.getByRole("alert").filter({ hasText: READ_ONLY_COPY }),
      "community post refused with the canonical read-only denial",
    ).toBeVisible({ timeout: 20_000 });
    await page.reload();
    await expectLearnerRender(page, "/legend/community");
    await expect(page.getByText(title), "the refused post persisted NOTHING").toHaveCount(0);

    // Crews — the one surface that HIDES the control for read-only personas
    // (isLegendReadOnly conceals CrewJoinButton; standings stay browsable).
    await expectLearnerRender(page, "/legend/crew");
    await expect(page.getByRole("button", { name: /^join$/i }), "no join control for read-only").toHaveCount(0);
    await expect(page.getByRole("button", { name: /^leave$/i }), "no leave control for read-only").toHaveCount(0);
  });
});

// ── 3 · READ-ONLY floor: community persona spot-check ───────────────────────
test.describe("LEG3ND · read-only floor (community)", () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "community", TEST_ORGS.professional);
  });

  test("community persona: composer refuses and crews hide join", async ({ page }) => {
    await expectLearnerRender(page, "/legend/community");
    const composer = page.locator("form:has([name='title'])").first();
    await expect(composer).toBeVisible({ timeout: 15_000 });
    await composer.locator("[name='title']").fill(`E2E Legend Post RO ${stamp()}`);
    await composer.getByRole("button", { name: /^post$/i }).click();
    await expect(
      composer.getByRole("alert").filter({ hasText: READ_ONLY_COPY }),
      "the community persona gets the same canonical denial",
    ).toBeVisible({ timeout: 20_000 });

    await expectLearnerRender(page, "/legend/crew");
    await expect(page.getByRole("button", { name: /^join$/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^leave$/i })).toHaveCount(0);
  });
});

// ── 4 · Nav filtering: the owner keeps the Manage group ─────────────────────
test.describe("LEG3ND · manager rail (owner)", () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("owner: the rail carries the full Manage group", async ({ page }) => {
    await page.goto("/legend/hub");
    const aside = rail(page);
    await expect(aside).toBeVisible({ timeout: 15_000 });
    await expect(aside.getByText(/^Manage$/), "the Manage group renders for manager+").toBeVisible();
    for (const label of [
      "Console",
      "Teach",
      "XMCE Engine",
      "Recert Matrix",
      "Recert Queue",
      "Credential Types",
      "Store Admin",
    ]) {
      await expect(aside.getByRole("link", { name: label, exact: true }), `Manage → ${label}`).toBeVisible();
    }
  });
});

// ── 5 · Denial consistency: member band on Manage URLs ──────────────────────
test.describe("LEG3ND · denial consistency (crew)", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "crew"));

  test("crew: every Manage surface is page-gated AccessDenied, never a broken form", async ({ page }) => {
    for (const path of [
      "/legend/teach",
      "/legend/store/admin",
      "/legend/signage/new",
      "/legend/resources/new",
    ]) {
      const r = await page.goto(path);
      expect(r?.status() ?? 0, `${path} should not be a 5xx`).toBeLessThan(500);
      expect(page.url(), `${path} does not bounce an authed member to /login`).not.toMatch(/\/login/);
      await expect(page.locator('[data-product="legend"]').first()).toBeVisible({ timeout: 15_000 });
      await expect(
        page.getByText(ACCESS_DENIED).first(),
        `${path} renders the explicit AccessDenied surface`,
      ).toBeVisible({ timeout: 15_000 });
      await expect(
        page.getByRole("link", { name: /back to overview/i }).first(),
        `${path} offers the escape hatch`,
      ).toBeVisible();
      // Page-gated means NO authoring form was mounted for the denied band —
      // the gate runs before render, not inside a later-refusing action.
      await expect(page.locator("main form"), `${path} mounts no authoring form`).toHaveCount(0);
      await expect(page.getByText(ERROR_BOUNDARY), `${path} has no error boundary`).toHaveCount(0);
    }
  });
});
