/**
 * ATLVS · Safety & Compliance — behavioral coverage (coverage program).
 *
 * Fills the behavioral gaps the coverage map flagged for Safety & Compliance
 * that the existing deep/persona specs do NOT already exercise. Each flow
 * drives a real mutation FSM / record-action to its materialised effect, as
 * the entitled persona, plus the manager-band write gate split (member can
 * file an incident through the universal intake but is RLS-blocked from the
 * manager-band safety writes — inspections, crisis).
 *
 * RLS facts this suite pins (supabase/migrations/20260625144337_rls_manager_grant_sweep):
 *   - incidents_insert  = is_org_member          → any member may file
 *   - incidents_update  = owner/admin/manager/controller/collaborator
 *   - inspections_insert/update = …/manager/…/crew (NOT bare member)
 *   - crisis_alerts_insert = owner/admin/manager/controller (NOT member)
 *
 * Fixture hygiene: every record is stamped `E2E <Thing> <ts>` and purged by
 * scripts/e2e-clean-fixtures.mjs (global teardown), so repeated prod runs
 * never accumulate.
 */
import { expect, test } from "./helpers/base";
import { authedSetup, suppressTour } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

// Resolve the first REAL record detail link under a list route (a UUID child,
// never the "+ New" sibling which also matches the /studio/<module>/ prefix).
// When `text` is given, only match anchors whose visible text contains it —
// so a stamped record is found even on a busy, paginated list.
async function findRecordLink(
  page: import("playwright/test").Page,
  listRoute: string,
  text?: string,
) {
  const links = page.locator(`a[href^="${listRoute}/"]`);
  const n = await links.count();
  for (let i = 0; i < n; i++) {
    const link = links.nth(i);
    const href = await link.getAttribute("href");
    if (!href || !UUID.test(href)) continue;
    if (text) {
      const label = (await link.textContent()) ?? "";
      if (!label.includes(text)) continue;
    }
    return link;
  }
  return null;
}

// Create an incident straight through the internal API (the console /new form
// is a client component that POSTs to /api/v1/incidents with no `name`-attr
// inputs and redirects to the LIST — so createInModule can't drive it and we'd
// never learn the new id). The API returns the row so we can deep-link its
// detail. Cookies ride the authed browser context. Summary is stamped for
// teardown.
async function createIncidentViaApi(
  page: import("playwright/test").Page,
  summary: string,
): Promise<string> {
  const res = await page.request.post("/api/v1/incidents", {
    data: { summary, severity: "minor", description: "E2E behavioral coverage incident." },
  });
  expect(res.ok(), `incident create failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const json = (await res.json()) as { ok: boolean; data: { incident: { id: string } } };
  expect(json.ok).toBeTruthy();
  return json.data.incident.id;
}

test.describe("ATLVS Safety & Compliance — behavioral coverage", () => {
  // Full login → create → transition chains run long on a serverless prod
  // target (cold-start creates observed ~50s); give real headroom.
  test.describe.configure({ timeout: 300000 });

  // Suppress the first-run ConsoleTour scrim (z-tour, full-viewport) — it
  // intercepts clicks on the /studio shell and hangs every action button.
  // File-scoped so the addInitScript lands before the in-test login goto.
  test.beforeEach(async ({ page }) => suppressTour(page));

  // ── Incidents ──────────────────────────────────────────────────────────

  // HIGH — the incident→remediation loop: manager fires "Create Corrective
  // Task" which spawns a tasks row back-linked via `[incident:<id>]`. The
  // marker doubles as the idempotency probe, so a second fire re-opens the
  // SAME task rather than creating a duplicate.
  test("manager: incident spawns a corrective task and a re-fire is idempotent", async ({ page }) => {
    await authedSetup(page, "manager");
    const summary = `E2E Incident ${stamp()}`;
    const id = await createIncidentViaApi(page, summary);

    await page.goto(`/studio/operations/incidents/${id}`);
    const createTask = page.getByRole("button", { name: /create corrective task/i });
    await expect(createTask).toBeVisible({ timeout: 15000 });
    await createTask.click();
    await expect(page).toHaveURL(new RegExp(`/studio/tasks/${UUID.source}`), { timeout: 90000 });
    const firstTaskUrl = page.url();

    // Re-fire from the same incident — the lineage marker resolves the
    // existing task, so we land back on the identical /studio/tasks/<uuid>.
    await page.goto(`/studio/operations/incidents/${id}`);
    const createAgain = page.getByRole("button", { name: /create corrective task/i });
    await expect(createAgain).toBeVisible({ timeout: 15000 });
    await createAgain.click();
    await expect(page).toHaveURL(new RegExp(`/studio/tasks/${UUID.source}`), { timeout: 90000 });
    expect(page.url()).toBe(firstTaskUrl);
  });

  // MEDIUM — incident edit round-trip (updateIncident): edit the summary from
  // the /[id]/edit form, land back on the detail, and confirm the new summary
  // persisted (manager is in the incidents_update manager band).
  test("manager: incident edit round-trip persists the new summary", async ({ page }) => {
    await authedSetup(page, "manager");
    const original = `E2E Incident ${stamp()}`;
    const id = await createIncidentViaApi(page, original);
    const renamed = `${original} edited`;

    await page.goto(`/studio/operations/incidents/${id}/edit`);
    const summary = page.locator('main [name="summary"]');
    await expect(summary).toBeVisible({ timeout: 15000 });
    await summary.fill(renamed);
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page).toHaveURL(new RegExp(`/studio/operations/incidents/${id}$`), { timeout: 90000 });
    await expect(page.getByRole("heading", { name: renamed })).toBeVisible({ timeout: 15000 });
  });

  // MEDIUM (positive control) — the universal-intake split: a bare member CAN
  // file an incident (incidents_insert = is_org_member), unlike the
  // manager-band safety writes below. Drives the real IncidentForm client
  // component (POST /api/v1/incidents → redirect to the list).
  test("member: files an incident through the Report It intake (allowed)", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/studio/operations/incidents/new");
    const summaryInput = page.locator("main form input[required]").first();
    await expect(summaryInput).toBeVisible({ timeout: 15000 });
    await summaryInput.fill(`E2E Incident ${stamp()}`);
    await page.getByRole("button", { name: /submit report/i }).click();
    // Success routes back to the incidents list; a denial would keep us on /new
    // with an error toast.
    await page.waitForURL((u) => u.pathname === "/studio/operations/incidents", { timeout: 90000 });
    await expect(page.getByRole("alert").filter({ hasText: /error|failed|denied|policy/i })).toHaveCount(0);
  });

  // LOW — incident soft-delete + undo flow (deleteIncident, no redirect;
  // DeleteForm's undo contract navigates client-side to the list).
  test("manager: incident soft-delete returns to the list", async ({ page }) => {
    await authedSetup(page, "manager");
    const id = await createIncidentViaApi(page, `E2E Incident ${stamp()}`);
    await page.goto(`/studio/operations/incidents/${id}`);
    await page.getByRole("button", { name: /^delete$/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await dialog.getByRole("button", { name: /^delete$/i }).click();
    await page.waitForURL((u) => u.pathname === "/studio/operations/incidents", { timeout: 90000 });
  });

  // ── Inspections ────────────────────────────────────────────────────────

  // HIGH — full inspection run: schedule → Start (scheduled→in_progress) →
  // Pass (in_progress→passed terminal) via transitionInspection; assert the
  // terminal state persists in the header badge. (Per-item pass/fail requires
  // a seeded inspection_template with items — see notes; the FSM terminal is
  // exercised here without one.)
  test("manager: inspection runs Start → Pass to a terminal state", async ({ page }) => {
    await authedSetup(page, "manager");
    await createInModule(page, "/studio/inspections/new", { name: `E2E Inspection ${stamp()}` });
    await expect(page).toHaveURL(new RegExp(`/studio/inspections/${UUID.source}`), { timeout: 90000 });

    const start = page.getByRole("button", { name: /^start$/i });
    await expect(start).toBeVisible({ timeout: 15000 });
    await start.click();

    // With no template there are zero checklist items → totals.fail === 0, so
    // the Pass control renders once we're in_progress.
    const pass = page.getByRole("button", { name: /^pass$/i });
    await expect(pass).toBeVisible({ timeout: 30000 });
    await pass.click();
    await expect(page.getByText(/^Passed$/)).toBeVisible({ timeout: 30000 });
  });

  // MEDIUM — inspection edit round-trip (updateInspection): retitle from the
  // /[id]/edit form and confirm the new name on the detail header.
  test("manager: inspection edit round-trip persists the new name", async ({ page }) => {
    await authedSetup(page, "manager");
    const original = `E2E Inspection ${stamp()}`;
    await createInModule(page, "/studio/inspections/new", { name: original });
    await expect(page).toHaveURL(new RegExp(`/studio/inspections/${UUID.source}`), { timeout: 90000 });
    const detailUrl = page.url();
    const id = detailUrl.match(UUID)![0];
    const renamed = `${original} edited`;

    await page.goto(`/studio/inspections/${id}/edit`);
    const nameInput = page.locator('main [name="name"]');
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill(renamed);
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page).toHaveURL(new RegExp(`/studio/inspections/${id}$`), { timeout: 90000 });
    await expect(page.getByRole("heading", { name: new RegExp(renamed) })).toBeVisible({ timeout: 15000 });
  });

  // MEDIUM (gated-denial) — a bare member is NOT in the inspections manager
  // band (owner/admin/manager/controller/collaborator/crew): the insert is
  // RLS-rejected and the form surfaces an error instead of redirecting.
  test("member: inspection create is RLS-denied", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/studio/inspections/new");
    const name = page.locator('main [name="name"]');
    await expect(name).toBeVisible({ timeout: 15000 });
    await name.fill(`E2E Inspection ${stamp()}`);
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    // Denied: we stay on /new and the FormShell error Alert (role="alert")
    // appears — RLS returns "new row violates row-level security policy".
    // .first() guards against a transient toast also carrying role="alert".
    await expect(page.getByRole("alert").first()).toBeVisible({ timeout: 60000 });
    await expect(page).toHaveURL(/\/studio\/inspections\/new(\?|$)/);
  });

  // ── Safety · Crisis alerts (edit + delete round-trip) ────────────────────

  // MEDIUM — crisis alert edit round-trip (updateAlert) then hard delete
  // (deleteAlert → list). Stands in for the safety edit/delete pattern shared
  // by environmental / major-incident / medical / safeguarding (see notes).
  test("manager: crisis alert edit round-trip then delete", async ({ page }) => {
    await authedSetup(page, "manager");
    const title = `E2E Crisis ${stamp()}`;
    // createInModule fills `title` + auto-satisfies the required `body`
    // textarea; the action redirects to the (created_at desc) list.
    await createInModule(page, "/studio/safety/crisis/new", { title });
    await expect(page).toHaveURL(/\/studio\/safety\/crisis(\?|$)/, { timeout: 90000 });

    const link = await findRecordLink(page, "/studio/safety/crisis", title);
    expect(link, "freshly-created crisis alert should be linkable on the list").not.toBeNull();
    await link!.click();
    await expect(page).toHaveURL(new RegExp(`/studio/safety/crisis/${UUID.source}`), { timeout: 30000 });
    const detailUrl = page.url();
    const id = detailUrl.match(UUID)![0];

    // Edit the title.
    const renamed = `${title} edited`;
    await page.goto(`/studio/safety/crisis/${id}/edit`);
    const titleInput = page.locator('main [name="title"]');
    await expect(titleInput).toBeVisible({ timeout: 15000 });
    await titleInput.fill(renamed);
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page).toHaveURL(new RegExp(`/studio/safety/crisis/${id}$`), { timeout: 90000 });
    await expect(page.getByRole("heading", { name: renamed })).toBeVisible({ timeout: 15000 });

    // Delete (no undo → server redirect to the list).
    await page.getByRole("button", { name: /^delete$/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await dialog.getByRole("button", { name: /^delete$/i }).click();
    await page.waitForURL((u) => u.pathname === "/studio/safety/crisis", { timeout: 90000 });
  });

  // MEDIUM (gated-denial, cross-module split) — the flip side of the member
  // incident intake above: a bare member is RLS-blocked from the manager-band
  // safety writes. Crisis create surfaces an error instead of redirecting.
  test("member: manager-band safety create (crisis) is RLS-denied", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/studio/safety/crisis/new");
    const title = page.locator('main [name="title"]');
    await expect(title).toBeVisible({ timeout: 15000 });
    await title.fill(`E2E Crisis ${stamp()}`);
    const body = page.locator('main [name="body"]');
    await body.fill("E2E denial probe.");
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    // .first() guards against a transient toast also carrying role="alert".
    await expect(page.getByRole("alert").first()).toBeVisible({ timeout: 60000 });
    await expect(page).toHaveURL(/\/studio\/safety\/crisis\/new(\?|$)/);
  });
});
