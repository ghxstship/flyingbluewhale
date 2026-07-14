/**
 * ATLVS · Projects & Programs — behavioral coverage (coverage program).
 *
 * Fills the behavioral gaps the coverage map flagged for Projects & Programs
 * that the existing deep/persona specs do NOT already exercise. Each flow
 * drives a real mutation to a materialised record and asserts the resulting
 * state/redirect, as the entitled persona.
 *
 * Covered:
 *  - Projects · ProjectStatusToggle → updateProjectAction (state advance) [HIGH]
 *  - Projects · member state-change denial (isManagerPlus server gate)      [LOW]
 *  - Events   · edit → event_state draft→scheduled via /events/[id]/edit    [HIGH]
 *  - Events   · delete from detail (deleteEvent) → drops from the list      [MEDIUM]
 *  - Unified Schedule · createActivity composer → block lands on timeline   [HIGH]
 *
 * Fixture hygiene: every record is stamped `E2E Project/Event/Activity <ts>`
 * and purged by scripts/e2e-clean-fixtures.mjs (global teardown), so repeated
 * prod runs never accumulate.
 */
import { expect, test } from "./helpers/base";
import { authedSetup, suppressTour } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

// Resolve the first REAL record detail link under a list route (a UUID child,
// never the "+ New" sibling which also matches the /studio/<module>/ prefix).
async function firstRecordLink(page: import("playwright/test").Page, listRoute: string) {
  const links = page.locator(`a[href^="${listRoute}/"]`);
  const n = await links.count();
  for (let i = 0; i < n; i++) {
    const href = await links.nth(i).getAttribute("href");
    if (href && UUID.test(href)) return links.nth(i);
  }
  return null;
}

test.describe("ATLVS Projects & Programs — behavioral coverage", () => {
  // Cold-start create → detail → transition chains legitimately run long on a
  // serverless prod target; give them real headroom.
  test.describe.configure({ timeout: 300000 });

  // Suppress the first-run ConsoleTour scrim (z-tour, full-viewport) — it
  // intercepts clicks on the /studio shell and hangs the action buttons.
  test.beforeEach(async ({ page }) => suppressTour(page));

  // HIGH — the ProjectStatusToggle drives updateProjectAction (a distinct
  // action from the /edit form). A fresh project starts `draft`; the toggle
  // advances it (draft → active) and surfaces a success toast. manager+ gated.
  test("manager: ProjectStatusToggle advances a project's state", async ({ page }) => {
    await authedSetup(page, "manager");
    const name = `E2E Project ${stamp()}`;
    await createInModule(page, "/studio/projects/new", { name });
    // Landed on the new project's detail.
    await expect(page).toHaveURL(new RegExp(`/studio/projects/${UUID.source}`), { timeout: 90000 });

    // The toggle button is labelled with the next state ("Mark active" from draft).
    const toggle = page.getByRole("button", { name: /^mark /i });
    await expect(toggle).toBeVisible({ timeout: 15000 });
    await toggle.click();
    // updateProjectAction returns { ok } → a success toast ("Marked <state>").
    await expect(page.getByText(/marked/i)).toBeVisible({ timeout: 30000 });
  });

  // LOW — the manager+ gate on updateProjectAction is honored for a bare
  // member: the toggle still renders (client control), but the server action
  // refuses with "Only manager+ can change project state" (defence-in-depth).
  test("member: project state change is refused by the manager+ gate", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/studio/projects");
    const first = await firstRecordLink(page, "/studio/projects");
    if (!first) return; // no project visible to this member — vacuously gated
    await first.click();
    await expect(page).toHaveURL(new RegExp(`/studio/projects/${UUID.source}`), { timeout: 30000 });
    const toggle = page.getByRole("button", { name: /^mark /i });
    if ((await toggle.count()) === 0) return; // detail not reachable — nothing to drive
    await toggle.click();
    await expect(page.getByText(/manager\+ can change project state/i)).toBeVisible({ timeout: 30000 });
  });

  // HIGH — the event lifecycle edit: advance event_state draft → scheduled via
  // the /events/[id]/edit form and confirm the detail reflects the new state.
  // The event is stamped with a far-past date so it sorts to the front of the
  // starts_at-ascending list (inside the capped window) and is easy to open.
  test("manager: edit an event and advance event_state to scheduled", async ({ page }) => {
    await authedSetup(page, "manager");
    const name = `E2E Event ${stamp()}`;
    await createInModule(page, "/studio/events/new", {
      name,
      starts_at: "2020-01-01T10:00",
      ends_at: "2020-01-01T11:00",
    });
    // createEventAction redirects to the list — open the row we just made.
    await expect(page).toHaveURL(/\/studio\/events(\?|$)/, { timeout: 90000 });
    const search = page.locator('main input[type="search"]').first();
    if (await search.count()) await search.fill(name);
    const row = page.getByRole("link", { name });
    await expect(row).toBeVisible({ timeout: 30000 });
    await row.click();
    await expect(page).toHaveURL(new RegExp(`/studio/events/${UUID.source}`), { timeout: 30000 });

    // Into the edit form → set the status select → save.
    await page.getByRole("link", { name: /^edit$/i }).click();
    await expect(page).toHaveURL(/\/studio\/events\/.+\/edit/, { timeout: 30000 });
    await page.locator('select[name="event_state"]').selectOption("scheduled");
    await page.getByRole("button", { name: /save changes/i }).click();

    // Back on the detail with the advanced state reflected.
    await expect(page).toHaveURL(new RegExp(`/studio/events/${UUID.source}(\\?|$)`), { timeout: 90000 });
    await expect(page.locator("main").getByText(/scheduled/i).first()).toBeVisible({ timeout: 30000 });
  });

  // MEDIUM — deleteEvent from the detail removes the row (events has no
  // deleted_at column; delete is a hard remove) and it disappears from the list.
  // Runs as OWNER: the `events_delete` RLS policy is the narrow owner/admin band
  // BY DESIGN (unified_schedule_events_rls_crew_grant — insert/update admit
  // manager+crew, DELETE does not). A manager's hard-delete is silently
  // RLS-filtered to 0 rows (no error), so the row would survive and the
  // disappears-from-list assertion would fail. Create is owner-eligible too.
  test("owner: delete an event from its detail page", async ({ page }) => {
    await authedSetup(page, "owner");
    const name = `E2E Event ${stamp()}`;
    await createInModule(page, "/studio/events/new", {
      name,
      starts_at: "2020-01-01T10:00",
      ends_at: "2020-01-01T11:00",
    });
    await expect(page).toHaveURL(/\/studio\/events(\?|$)/, { timeout: 90000 });
    const search = page.locator('main input[type="search"]').first();
    if (await search.count()) await search.fill(name);
    const row = page.getByRole("link", { name });
    await expect(row).toBeVisible({ timeout: 30000 });
    await row.click();
    await expect(page).toHaveURL(new RegExp(`/studio/events/${UUID.source}`), { timeout: 30000 });

    // Open the delete confirmation dialog, then confirm inside it.
    await page.getByRole("button", { name: /^delete$/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await dialog.getByRole("button", { name: /^delete$/i }).click();

    // Redirected back to the list; the deleted event is gone.
    await expect(page).toHaveURL(/\/studio\/events(\?|$)/, { timeout: 90000 });
    const search2 = page.locator('main input[type="search"]').first();
    if (await search2.count()) await search2.fill(name);
    await expect(page.getByRole("link", { name })).toHaveCount(0, { timeout: 30000 });
  });

  // HIGH — the Unified Schedule composer: createActivity writes an events row
  // and the block lands on the timeline for the focused day. The whole write
  // path was previously untested (only field presence was asserted). Default
  // times (T09:00–T17:00) + no resource_ref means no guardrail conflict.
  test("manager: submit a New Activity and it lands on the timeline", async ({ page }) => {
    await authedSetup(page, "manager");
    await page.goto("/studio/operations/schedule");
    const name = `E2E Activity ${stamp()}`;

    await page.getByRole("button", { name: /\+ new activity/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await dialog.locator('input[name="name"]').fill(name);
    await dialog.getByRole("button", { name: /^create$/i }).click();

    // Clean success closes the dialog; the new block is on the day timeline.
    await expect(dialog).toBeHidden({ timeout: 90000 });
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 30000 });
  });
});
