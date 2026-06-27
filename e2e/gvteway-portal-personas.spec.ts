/**
 * GVTEWAY portal (/p/[slug]/<persona>) — per-persona render + CRUD journeys.
 *
 * Phase 3 of the per-product / per-persona suite (mirrors the STYLE of
 * `e2e/atlvs-console-personas.spec.ts` + `e2e/compvss-field-personas.spec.ts`).
 * Covers all 15 PORTAL personas that land in the GVTEWAY portal shell
 * (`data-platform="gvteway"`):
 *
 *   EXECUTIVE  promoter · producer · stakeholder
 *   TALENT     artist · athlete · delegation
 *   MARKETING  client · sponsor · media
 *   OPERATIONS vendor · crew · volunteer · hospitality
 *   EXPERIENCE guest · vip
 *
 * Portal authz is PATH-DRIVEN: `(portal)/p/[slug]/layout.tsx` hard-404s only on
 * an unknown slug; everything below is RLS-scoped to the session. The persona
 * "view" is purely the URL segment — a fixture only needs a login + org
 * membership granting RLS read on the project. So this suite is organized as a
 * deep READ journey for every persona (overview + every rail sub-route renders
 * with the gvteway shell, no /login bounce, an h1, no error boundary), plus the
 * two CRUD-capable personas get a full mutation journey:
 *
 *   • artist — submit a talent deliverable on /artist/advancing (the inline
 *     submitDeliverableAction → deliverables INSERT, fulfillment_state=submitted)
 *     and assert the new row renders with its state.
 *   • client — request a scope change-order on a seeded proposal
 *     (createChangeOrderAction → proposal_change_orders INSERT) and assert the
 *     redirect to the new change-order detail with no error surface.
 *
 * The 13 fixtures created for this phase + the pre-existing client/crew fixtures
 * are seeded `test+<persona>@flyingbluewhale.app` (password FlyingBlue!Test2026),
 * members of the Test Professional org with last_org_id pinned to it so
 * server-action session.orgId resolves to the proposal's org. The membership
 * persona is the COARSE session persona ('member') — the 15 portal sub-personas
 * are NOT valid memberships.persona values (memberships_persona_check admits only
 * the 11 coarse personas), and the persona is not the authz input here: the URL
 * segment is. So each portal persona is exercised by URL, not by membership row.
 *
 * Rail sub-routes are derived live from `portalNav(slug, persona)` (the nav
 * SSOT) so this spec can never drift from what the rail actually renders.
 */
import { expect, test, type Page } from "playwright/test";
import { authedSetup } from "./helpers/auth";
import { stamp } from "./helpers/forms";
import { PORTAL_PERSONAS, portalNav, type PortalPersona, type NavGroup } from "../src/lib/nav";

const SLUG = "test-professional-show";
const PROPOSAL_ID = "3e7fbd4f-0f30-4cb0-b1e0-57ff7ae727b5";
const ERROR_BOUNDARY = /application error|something went wrong|unhandled|digest:|client-side exception/i;

/** Flatten a portal NavGroup (workspace + persona sections) to its hrefs. */
function railHrefs(group: NavGroup): string[] {
  const out: string[] = [];
  for (const item of group.items) out.push(item.href);
  for (const section of group.sections ?? []) {
    for (const item of section.items) out.push(item.href);
  }
  // De-dupe + keep order; the Guide/Schedule appear once per group.
  return out.filter((href, i) => out.indexOf(href) === i);
}

/** Assert a portal page rendered the gvteway shell, an h1, and no error. */
async function expectPortalRender(page: Page, path: string): Promise<void> {
  const r = await page.goto(path);
  expect(r?.status() ?? 0, `${path} should not be a 5xx`).toBeLessThan(500);
  expect(page.url(), `${path} must not bounce to /login`).not.toMatch(/\/login/);
  await expect(
    page.locator('[data-platform="gvteway"]').first(),
    `${path} renders the GVTEWAY portal shell`,
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("h1").first(), `${path} renders a heading`).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(ERROR_BOUNDARY), `${path} has no error boundary`).toHaveCount(0);
}

for (const persona of PORTAL_PERSONAS) {
  test.describe(`GVTEWAY portal · ${persona}`, () => {
    test.describe.configure({ timeout: 180_000 });
    test.beforeEach(async ({ page }) => authedSetup(page, persona));

    // ── Shell + auth: the persona overview lands in the gvteway shell ───────
    test(`${persona} lands on its portal overview with the GVTEWAY shell`, async ({ page }) => {
      await expectPortalRender(page, `/p/${SLUG}/${persona}`);
    });

    // ── Deep read journey: every rail sub-route renders ─────────────────────
    test(`${persona}: every rail sub-route renders`, async ({ page }) => {
      const hrefs = railHrefs(portalNav(SLUG, persona as PortalPersona));
      expect(hrefs.length, `${persona} rail exposes routes`).toBeGreaterThan(0);
      for (const href of hrefs) {
        await expectPortalRender(page, href);
      }
    });
  });
}

// ── artist CRUD journey ───────────────────────────────────────────────────
// The artist advancing surface mounts the submit form INLINE on the index
// (no /new route): pick a type, fill the title, submit → deliverables INSERT
// with fulfillment_state=submitted. Success toasts + resets the form and the
// new row appears in its type section with a StatusBadge.
test.describe("GVTEWAY portal · artist CRUD — advancing", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "artist"));

  test("artist submits a talent deliverable", async ({ page }) => {
    await expectPortalRender(page, `/p/${SLUG}/artist/advancing`);

    const title = `E2E Artist Deliverable ${stamp()}`;
    const form = page.locator("form:has([name='title'])").first();
    await expect(form).toBeVisible({ timeout: 15_000 });
    await form.locator("[name='title']").fill(title);
    // Default type is technical_rider; pick stage_plot for a deterministic
    // section. The select is a native <select name="type">.
    await form.locator("select[name='type']").selectOption("stage_plot").catch(() => {});
    await form.locator("textarea[name='notes']").fill(`Submitted by the e2e artist journey ${stamp()}`);

    await form.getByRole("button", { name: /submit deliverable/i }).click();

    // No action/RLS error surfaced (the inline Alert kind="error").
    await expect(
      page.locator(".ps-alert--danger, [role='alert']").filter({ hasText: /error|failed|violates|denied/i }),
      "deliverable submit surfaced no error",
    ).toHaveCount(0);

    // The submit revalidates the page; the new row appears with its title.
    // Reload to read server truth (the INSERT persisted under RLS).
    await page.reload();
    await expectPortalRender(page, `/p/${SLUG}/artist/advancing`);
    await expect(
      page.getByText(title, { exact: false }).first(),
      "the submitted deliverable persisted + renders",
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ── client CRUD journey ───────────────────────────────────────────────────
// The client drives the proposal lifecycle. Request a scope change-order on the
// seeded proposal: createChangeOrderAction resolves the proposal under
// session.orgId (the client fixture's last_org_id IS the proposal's org) and
// INSERTs into proposal_change_orders (is_org_member band), then redirects to
// the new change-order detail.
test.describe("GVTEWAY portal · client CRUD — proposal lifecycle", () => {
  test.describe.configure({ timeout: 180_000 });
  const coBase = `/p/${SLUG}/client/proposals/${PROPOSAL_ID}/change-orders`;
  test.beforeEach(async ({ page }) => authedSetup(page, "client"));

  test("client reads the proposal lifecycle sub-pages", async ({ page }) => {
    const proposalBase = `/p/${SLUG}/client/proposals/${PROPOSAL_ID}`;
    for (const path of [
      proposalBase,
      `${proposalBase}/revisions`,
      `${proposalBase}/change-orders`,
      `${proposalBase}/lifecycle`,
      `${proposalBase}/approvals`,
    ]) {
      await expectPortalRender(page, path);
      await expect(page.getByText(/not found/i)).toHaveCount(0);
    }
  });

  test("client requests a scope change-order", async ({ page }) => {
    await expectPortalRender(page, `${coBase}/new`);

    const title = `E2E Change Order ${stamp()}`;
    const form = page.locator("form:has([name='title'])").first();
    await expect(form).toBeVisible({ timeout: 15_000 });
    await form.locator("[name='title']").fill(title);
    await form.locator("textarea[name='body']").fill("Requesting an added LED wall per the revised scope.");
    // FormShell submits the action; success redirects to the CO detail.
    await form.evaluate((f: HTMLFormElement) => f.requestSubmit());

    // Landed on the new change-order detail (out of /new), no error surface.
    await expect(page, "redirected to the new change-order detail").not.toHaveURL(/\/new(\?|$)/, { timeout: 35_000 });
    await expect(page).toHaveURL(new RegExp(`${coBase.replace(/[/]/g, "\\/")}\\/[0-9a-f-]{36}`), { timeout: 35_000 });
    await expect(
      page.getByRole("alert").filter({ hasText: /error|failed|invalid|not found/i }),
      "change-order create surfaced no error",
    ).toHaveCount(0);
    await expect(page.getByText(title, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  });
});
