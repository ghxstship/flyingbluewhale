/**
 * Personal (/me) shell — per-persona render sweep + self-service CRUD journeys.
 *
 * Phase 5 (final) of the per-product / per-persona suite (mirrors the STYLE of
 * `e2e/atlvs-console-personas.spec.ts`, `e2e/compvss-field-personas.spec.ts`,
 * `e2e/gvteway-portal-personas.spec.ts`, and `e2e/legend-personas.spec.ts`).
 *
 * The (personal) shell is each authed user's OWN self-service workspace —
 * `src/app/(personal)/me/**`, painted `data-product="atlvs"` (product-agnostic;
 * no `data-platform`), content in `<main class="... max-w-5xl">`. EVERY authed
 * persona lands here regardless of which product shell resolveShell routes them
 * to — /me is the cross-shell account surface. So unlike the role-banded console
 * the /me writes are self-scoped (`user_id = auth.uid()`), and the journeys
 * exercise the real self-service mutations end-to-end.
 *
 * Structure:
 *   1. RENDER SWEEP — data-driven off `personalNavGroups` (the nav SSOT) across
 *      THREE personas spanning the role/persona space that lands in /me:
 *        · owner     (role=owner   — operator)
 *        · member    (role=member, persona=member   — plain authed user)
 *        · community (role=member, persona=community — marketplace-capable)
 *      Each persona walks every /me surface and asserts: authed (no /login
 *      bounce), the personal shell painted, an h1, no error boundary.
 *   2. CRUD JOURNEYS — the real self-service mutations, asserting the write
 *      PERSISTED (read server truth after the mutation):
 *        · Profile edit (/me/profile)            — users UPDATE
 *        · Preferences (/me/preferences)         — user_preferences upsert
 *        · Settings (/me/settings)               — user_preferences upsert
 *        · Talent EPK (/me/talent)               — talent_profiles upsert
 *        · Crew profile (/me/crew)               — crew_members upsert
 *        · Availability (/me/availability)       — availability_slots add + delete
 *        · Saved search (/me/saved-searches)     — saved_searches add
 *      The talent/crew/availability journeys run under the `member` persona — the
 *      plain authed user the surfaces are FOR. crew_members in particular was an
 *      app-vs-RLS inversion (write band omitted the self-write clause, so a
 *      member could read the editor but the INSERT/UPDATE was RLS-rejected);
 *      fixed in 20260625164140_crew_members_rls_self_write_grant.sql and guarded
 *      by src/lib/personal-self-service-rls-canon.test.ts.
 *
 * Fixtures: the seeded `test+<role>@flyingbluewhale.app` users (password
 * FlyingBlue!Test2026), members of the Test Professional Org (f4509a5f). The
 * self-service rows are keyed to the caller's own user_id, so the journeys are
 * idempotent re-runs (upsert / dedup-by-stamp) with no durable cross-tenant
 * pollution.
 */
import { expect, test, type Page } from "playwright/test";
import { authedSetup } from "./helpers/auth";
import { stamp } from "./helpers/forms";
import { personalNavGroups } from "../src/lib/nav";

const ERROR_BOUNDARY = /application error|something went wrong|unhandled|digest:|client-side exception/i;
const RLS_ERROR = /violates row-level security|permission denied|not authorized|denied/i;

/** Flatten personalNavGroups to its hrefs (de-duped, order preserved). */
function personalHrefs(): string[] {
  const out: string[] = [];
  for (const g of personalNavGroups) for (const item of g.items) out.push(item.href);
  return out.filter((h, i) => out.indexOf(h) === i);
}

/** Assert a /me page rendered authed in the personal shell, an h1, and no error. */
async function expectPersonalRender(page: Page, path: string): Promise<void> {
  const r = await page.goto(path);
  expect(r?.status() ?? 0, `${path} should not be a 5xx`).toBeLessThan(500);
  expect(page.url(), `${path} must not bounce to /login`).not.toMatch(/\/login/);
  await expect(
    page.locator('[data-product="atlvs"]').first(),
    `${path} renders the personal shell`,
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("main h1").first(), `${path} renders a heading`).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(ERROR_BOUNDARY), `${path} has no error boundary`).toHaveCount(0);
}

/**
 * Fill a /me FormShell's named fields by type, submit via requestSubmit, and
 * assert no error surface. The /me actions revalidate IN PLACE (no redirect) on
 * success, so this returns once the action settled with a clean alert region.
 */
async function fillAndSubmit(page: Page, fields: Record<string, string>): Promise<void> {
  for (const [name, value] of Object.entries(fields)) {
    const el = page.locator(`main [name="${name}"]`).first();
    if (!(await el.count())) continue;
    const tag = await el.evaluate((e) => e.tagName);
    if (tag === "SELECT") {
      const opts = await el
        .locator("option")
        .evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value).filter(Boolean));
      const target = opts.includes(value) ? value : opts[0];
      if (target) await el.selectOption(target);
    } else {
      await el.fill(value);
    }
  }
  await page
    .locator("main form")
    .first()
    .evaluate((f: HTMLFormElement) => f.requestSubmit());
  await expect(
    page.getByRole("alert").filter({ hasText: /error|failed|invalid/i }),
    "self-service save surfaced no error",
  ).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByText(RLS_ERROR), "self-service save surfaced no RLS error").toHaveCount(0);
}

// ── Render sweep across the personas that reach /me ─────────────────────────
// /me is the personal shell for ANY authed user, so every non-anon persona must
// render its surfaces. M7 — previously only owner/member/community were swept
// (3 of ~11); this covers the internal bands + the portal/field personas too.
for (const fixture of [
  "owner",
  "admin",
  "manager",
  "member",
  "collaborator",
  "contractor",
  "crew",
  "client",
  "viewer",
  "community",
] as const) {
  test.describe(`personal /me · ${fixture}`, () => {
    test.describe.configure({ timeout: 240_000 });
    test.beforeEach(async ({ page }) => authedSetup(page, fixture));

    test(`${fixture} lands on /me with the personal shell`, async ({ page }) => {
      await expectPersonalRender(page, "/me");
    });

    test(`${fixture}: every personalNav surface renders`, async ({ page }) => {
      const hrefs = personalHrefs();
      expect(hrefs.length, "personalNavGroups exposes routes").toBeGreaterThan(0);
      for (const href of hrefs) {
        await expectPersonalRender(page, href);
      }
    });
  });
}

// ── Account self-service CRUD (owner — the operator's own account) ──────────
test.describe("personal /me · account CRUD (owner)", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("Profile · update display name → persists", async ({ page }) => {
    await expectPersonalRender(page, "/me/profile");
    const name = `E2E Owner ${stamp()}`;
    await expect(page.locator('main [name="name"]').first()).toBeVisible({ timeout: 15_000 });
    await fillAndSubmit(page, { name });
    // Read server truth — the users UPDATE persisted + the input reflects it.
    await page.reload();
    await expectPersonalRender(page, "/me/profile");
    await expect(page.locator('main [name="name"]').first()).toHaveValue(name, { timeout: 15_000 });
  });

  test("Preferences · save appearance + locale", async ({ page }) => {
    await expectPersonalRender(page, "/me/preferences");
    // savePreferencesAction persists density + locale + timezone + consent (color
    // MODE is the client data-mode axis, set at /me/settings/appearance — it is
    // NOT a field here anymore; the old name="theme" radio submitted mode values
    // against the theme-slug schema and silently failed the whole save). Pick a
    // density + a deterministic locale/timezone and assert the save persists.
    const density = page.locator('main input[name="density"][value="compact"]');
    if (await density.count()) await density.check();
    await fillAndSubmit(page, { locale: "en", timezone: "America/New_York" });
    await page.reload();
    await expectPersonalRender(page, "/me/preferences");
    await expect(page.locator('main [name="timezone"]').first()).toHaveValue("America/New_York", { timeout: 15_000 });
  });

  test("Settings · save preferences with no error", async ({ page }) => {
    await expectPersonalRender(page, "/me/settings");
    // The settings page upserts user_preferences (density/locale/timezone). Fill
    // whatever named fields it exposes and assert a clean save.
    await fillAndSubmit(page, { timezone: "America/New_York" });
  });
});

// ── Marketplace self-service CRUD (member — the plain authed user) ──────────
// These are the surfaces the marketplace-capable self user manages. crew_members
// + talent_profiles writes are self-scoped (user_id = auth.uid()); the crew
// write was the RLS inversion fixed for this phase.
test.describe("personal /me · marketplace CRUD (member)", () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "member"));

  test("Talent EPK · upsert self-managed profile → persists", async ({ page }) => {
    await expectPersonalRender(page, "/me/talent");
    const act = `E2E Act ${stamp()}`;
    await expect(page.locator('main [name="act_name"]').first()).toBeVisible({ timeout: 15_000 });
    await fillAndSubmit(page, { act_name: act, tagline: "Self-managed EPK update." });
    await page.reload();
    await expectPersonalRender(page, "/me/talent");
    await expect(page.locator('main [name="act_name"]').first()).toHaveValue(act, { timeout: 15_000 });
  });

  test("Crew profile · upsert self-managed profile → persists (RLS self-write)", async ({ page }) => {
    await expectPersonalRender(page, "/me/crew");
    const cname = `E2E Crew ${stamp()}`;
    await expect(page.locator('main [name="name"]').first()).toBeVisible({ timeout: 15_000 });
    // The write band once omitted the self-write clause — a member PASSED the
    // app check but RLS rejected the INSERT. This assertion is the live witness
    // for 20260625164140_crew_members_rls_self_write_grant.sql.
    await fillAndSubmit(page, { name: cname, bio: "Self-managed crew profile update." });
    await page.reload();
    await expectPersonalRender(page, "/me/crew");
    await expect(page.locator('main [name="name"]').first()).toHaveValue(cname, { timeout: 15_000 });
  });

  test("Availability · add a slot → persists → delete it", async ({ page }) => {
    await expectPersonalRender(page, "/me/availability");
    const label = `E2E Slot ${stamp()}`;
    const start = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 16);
    const end = new Date(Date.now() + 8 * 86_400_000).toISOString().slice(0, 16);
    // The add form lives in the "Add slot" section (kind select + label + dates).
    await page.locator('main [name="starts_at"]').first().fill(start);
    await page.locator('main [name="ends_at"]').first().fill(end);
    await page.locator('main [name="label"]').first().fill(label);
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page.getByText(RLS_ERROR), "availability add surfaced no RLS error").toHaveCount(0);

    // Read server truth — the slot row persisted + renders in "Upcoming".
    await page.reload();
    await expectPersonalRender(page, "/me/availability");
    const row = page.locator("li").filter({ hasText: label }).first();
    await expect(row, "the added availability slot persisted").toBeVisible({ timeout: 15_000 });

    // Delete leg — the per-row Remove button fires deleteAvailabilityAction.
    await row.getByRole("button", { name: /remove/i }).click();
    await expect(page.getByText(RLS_ERROR), "availability delete surfaced no RLS error").toHaveCount(0);
    await page.reload();
    await expectPersonalRender(page, "/me/availability");
    await expect(
      page.locator("li").filter({ hasText: label }),
      "the deleted availability slot is gone",
    ).toHaveCount(0);
  });

  test("Saved search · add a subscription → no error", async ({ page }) => {
    await expectPersonalRender(page, "/me/saved-searches");
    // saved_searches add form (kind select + name + query JSON). The action
    // requires valid JSON in `query` if present — leave it empty (defaults {}).
    await fillAndSubmit(page, { name: `E2E Search ${stamp()}` });
  });
});

// ── reviews/new explainer is an honest empty-state without a transaction ────
// /me/reviews/new without a ?transaction* querystring renders the "anchored to a
// real transaction" explainer + CTAs (no form) — a correct render, not a stub.
test.describe("personal /me · reviews anchor gate (member)", () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "member"));

  test("reviews/new renders the anchored-transaction explainer", async ({ page }) => {
    await expectPersonalRender(page, "/me/reviews/new");
    await expect(
      page.getByText(/anchored to a real transaction|start a review from the transaction/i).first(),
      "the review composer requires a real transaction anchor (honest empty-state)",
    ).toBeVisible({ timeout: 15_000 });
  });
});
