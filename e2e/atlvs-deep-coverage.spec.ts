/**
 * ATLVS operator console (/studio) — DEEP coverage.
 *
 * `atlvs-console-personas.spec.ts` is a capability LADDER: it proves each
 * operator band lands in /studio and can (or cannot) create a Task, a Project,
 * a Finance invoice, and open org Settings. It stops at the FIRST transition of
 * each record and never walks a multi-step lifecycle to its terminal state.
 *
 * This spec goes DEEPER on the same shell — real end-to-end journeys and the
 * action-level authz boundaries the ladder never reaches:
 *
 *   owner        · Proposal draft→sent→approved→signed→Convert-to-Project
 *                · Purchase Order draft→sent→acknowledged→FULFILLED (terminal)
 *                · Invoice draft→VOIDED (terminal danger branch)
 *   manager      · Requisition create→approve→Convert-To-PO
 *                · Advancing assignment authoring + advanceState (briefed→draft)
 *                · RFQ create→Award→auto-draft PO
 *                · Budget create→edit round-trip
 *   collaborator · action/layout gates: requisition Convert, master-catalog,
 *                  day-sheet, proposal creation are all blocked
 *   member       · requisition create is RLS-blocked (persona `member` is NOT in
 *                  the requisitions_insert grant — the insert-vs-grant gap the
 *                  ladder documents for Tasks, here for Procurement)
 *
 * ── Ground truth (verified against the live DB) ─────────────────────────────
 * The seeded operators share role bands but differ by `persona`:
 *   owner→owner · manager→manager · collaborator/member→role=member.
 * `private.has_org_role(org, roles[])` matches `role = any(roles) OR
 * persona = any(roles)`, so the `collaborator` PERSONA is admitted by
 * `requisitions_insert` (owner/admin/manager/controller/collaborator) while the
 * bare `member` persona is not. `isManagerPlus` is a separate APP gate keyed on
 * role ∈ {owner,admin,manager} — so a collaborator (role=member) is admitted to
 * the requisitions TABLE yet blocked from the manager+ Convert action, and never
 * even sees the Convert button (it is server-gated on isManagerPlus).
 *
 * Two blocked cases resolve at a different tier than a naive reading suggests,
 * so they are asserted at the tier that actually fires:
 *   • Master-catalog create → /studio/settings/catalog is unlisted in
 *     settingsNav, so the settings LAYOUT gate (unlisted ⇒ manager floor) denies
 *     a member before the action runs → AccessDenied, not the action string.
 *   • Requisition Convert (collaborator) → the button is server-gated on
 *     isManagerPlus, so it never renders for a collaborator → we assert its
 *     ABSENCE (even after driving the requisition to `approved`, which the
 *     collaborator persona is allowed to do) rather than an unreachable error.
 *
 * Fixtures: the seeded `test+<role>@flyingbluewhale.app` users (Test
 * Professional Org). AccessDenied renders EmptyState "You Don't Have Access".
 */
import { expect, test, type Page } from "./helpers/base";
import { authedSetup } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

// MANDATORY /studio gotcha: the first-run ConsoleTour overlay (a full-viewport
// scrim, z-[var(--p-z-tour)]) intercepts clicks. Suppress it BEFORE authedSetup
// so it's set on every navigation, including /login.
async function suppressTour(page: Page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("atlvs.tour.console.v1", "done");
    } catch {
      /* storage may be unavailable pre-navigation; the goto retries it */
    }
  });
}

const UUID = "[0-9a-f-]{36}";
const ACCESS_DENIED = /you don'?t have access/i;

/**
 * Fill every visible `<MoneyInput>` (placeholder "0.00") in the main form with a
 * dollar amount and blur the last one so its onChange/onBlur commits the hidden
 * cents value the server action reads. `createInModule` can't drive MoneyInput
 * (the named field is the hidden input; the required attr is on the visible one),
 * so money-bearing creates fill it explicitly.
 */
async function fillMoney(page: Page, dollars: string) {
  const inputs = page.locator('main [placeholder="0.00"]');
  const n = await inputs.count();
  for (let i = 0; i < n; i++) await inputs.nth(i).fill(dollars);
  if (n > 0) await inputs.nth(n - 1).blur();
}

/** requestSubmit the first main form and assert it left /new with no error. */
async function submitAndLeaveNew(page: Page) {
  await page
    .locator("main form")
    .first()
    .evaluate((f: HTMLFormElement) => f.requestSubmit());
  await expect(page).not.toHaveURL(/\/new(\?|$)/, { timeout: 75_000 });
  await expect(page.getByRole("alert").filter({ hasText: /error|failed|invalid/i })).toHaveCount(0);
}

/** Fill a /new form's fields and submit WITHOUT asserting success (blocked cases). */
async function fillAndSubmit(page: Page, route: string, fields: Record<string, string>) {
  await page.goto(route);
  for (const [name, value] of Object.entries(fields)) {
    const el = page.locator(`main [name="${name}"]`).first();
    if (await el.count()) await el.fill(value).catch(() => {});
  }
  await page
    .locator("main form")
    .first()
    .evaluate((f: HTMLFormElement) => f.requestSubmit());
}

// ────────────────────────────────────────────────────────────────────────────
// owner — full lifecycle journeys to terminal state
// ────────────────────────────────────────────────────────────────────────────
test.describe("ATLVS console deep coverage (owner)", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => {
    await suppressTour(page);
    await authedSetup(page, "owner");
  });

  test("Proposal: sign the FSM, then Convert to Project", async ({ page }) => {
    // Create with a real amount so conversion has money to seed deposit/balance.
    await page.goto("/studio/proposals/new");
    await page.locator('main [name="title"]').fill(`E2E Proposal ${stamp()}`);
    await fillMoney(page, "100000");
    await submitAndLeaveNew(page);
    const proposalId = page.url().match(new RegExp(`/studio/proposals/(${UUID})`, "i"))?.[1];
    expect(proposalId, "landed on the new proposal detail").toBeTruthy();

    // Walk draft → sent → approved → signed via the header status controls.
    // Each control re-renders the segment (server action + revalidatePath), so
    // wait for the NEXT label to confirm the transition committed.
    await page.getByRole("button", { name: "Send to Client" }).click();
    await expect(page.getByRole("button", { name: "Mark Approved" })).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Mark Approved" }).click();
    await expect(page.getByRole("button", { name: "Mark Signed" })).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Mark Signed" }).click();

    // Signed is terminal for the status control; the Convert button appears.
    await expect(page.getByRole("button", { name: "Convert to Project" })).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Convert to Project" }).click();
    await expect(page, "convert redirects to the freshly-materialised project").toHaveURL(
      new RegExp(`/studio/projects/${UUID}`, "i"),
      { timeout: 30_000 },
    );

    // Back on the proposal: the project now exists, so the header swaps Convert
    // for a "View Project" link and never offers to re-create.
    await page.goto(`/studio/proposals/${proposalId}`);
    await expect(page.getByRole("link", { name: "View Project" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Convert to Project" })).toHaveCount(0);
  });

  test("Purchase Order: full chain to Fulfilled (terminal)", async ({ page }) => {
    const vendor = `E2E Vendor ${stamp()}`;
    await createInModule(page, "/studio/procurement/vendors/new", {
      name: vendor,
      coi_expires_at: "2030-01-01",
      w9: "true",
    });
    await createInModule(page, "/studio/procurement/purchase-orders/new", {
      title: `E2E PO ${stamp()}`,
      vendor_id: vendor,
      amount: "5000",
    });
    await expect(page).toHaveURL(new RegExp(`/purchase-orders/${UUID}`, "i"), { timeout: 20_000 });

    await page.getByRole("button", { name: "Send PO" }).click();
    await expect(page.getByRole("button", { name: "Mark Acknowledged" })).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Mark Acknowledged" }).click();
    await expect(page.getByRole("button", { name: "Mark Fulfilled" })).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Mark Fulfilled" }).click();

    // NEXT[fulfilled]=null and Cancel is hidden once fulfilled — the status
    // control row is now empty, and the badge reads Fulfilled.
    await expect(page.getByText(/fulfilled/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Mark Fulfilled" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Send PO" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Mark Acknowledged" })).toHaveCount(0);
  });

  test("Invoice: void terminal branch from draft", async ({ page }) => {
    await page.goto("/studio/finance/invoices/new");
    await page.locator('main [name="title"]').fill(`E2E Invoice ${stamp()}`);
    await fillMoney(page, "123.45");
    await submitAndLeaveNew(page);
    await expect(page).toHaveURL(new RegExp(`/invoices/${UUID}`, "i"), { timeout: 20_000 });

    // Void directly from draft (setInvoiceStatusAction(id,'voided')).
    await page.getByRole("button", { name: "Void" }).click();
    await expect(page.getByText(/voided/i).first()).toBeVisible({ timeout: 20_000 });
    // NEXT[voided]=null and the Void button hides once voided — both controls gone.
    await expect(page.getByRole("button", { name: "Void" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Send Invoice" })).toHaveCount(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// manager — cross-record conversions + authoring the advancing lifecycle
// ────────────────────────────────────────────────────────────────────────────
test.describe("ATLVS console deep coverage (manager)", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => {
    await suppressTour(page);
    await authedSetup(page, "manager");
  });

  test("Requisition: create → approve → Convert To PO", async ({ page }) => {
    const title = `E2E Req ${stamp()}`;
    await createInModule(page, "/studio/procurement/requisitions/new", { title });
    // createReqAction redirects to the LIST; the title cell is the row link.
    await page.getByRole("link", { name: title }).first().click();
    await expect(page).toHaveURL(new RegExp(`/requisitions/${UUID}`, "i"), { timeout: 20_000 });
    const reqId = page.url().match(new RegExp(`/requisitions/(${UUID})`, "i"))![1];

    // Convert To PO is server-gated on requisition_state='approved'; advance it
    // via the edit form (manager is admitted to requisitions_update).
    await page.goto(`/studio/procurement/requisitions/${reqId}/edit`);
    await page.locator('select[name="requisition_state"]').selectOption("approved");
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page).toHaveURL(new RegExp(`/requisitions/${reqId}(\\?|$)`), { timeout: 20_000 });

    await page.getByRole("button", { name: "Convert To PO" }).click();
    await expect(page, "convert lands on a new draft purchase order").toHaveURL(
      new RegExp(`/purchase-orders/${UUID}`, "i"),
      { timeout: 30_000 },
    );
    await expect(page.getByText(/draft/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test("Advancing: author an assignment + advanceState (briefed→draft)", async ({ page }) => {
    // A SKU must exist or the new-assignment form shows an empty state (no select).
    // Catalog canonical home moved to the LEG3ND hub (decision 6 rider).
    await createInModule(page, "/legend/hub/catalogs/new", {
      name: `E2E SKU ${stamp()}`,
      code: `e2e-cred-${stamp()}`,
      kind: "credential",
    });
    await createInModule(page, "/studio/projects/new", { name: `E2E AdvProj ${stamp()}` });
    const projectId = page.url().match(new RegExp(`/studio/projects/(${UUID})`, "i"))![1];

    const asgTitle = `E2E Assign ${stamp()}`;
    await createInModule(page, `/studio/projects/${projectId}/advancing/assignments/new`, { title: asgTitle });
    // createAssignmentAction redirects to the LIST; the row link is the Party
    // cell (col 0). The new project has exactly one assignment — open it.
    await expect(page).toHaveURL(/\/advancing\/assignments(\?|$)/, { timeout: 20_000 });
    await page.locator("tbody tr", { hasText: asgTitle }).getByRole("link").first().click();
    await expect(page).toHaveURL(new RegExp(`/advancing/assignments/${UUID}`, "i"), { timeout: 20_000 });
    await expect(page.getByText("Briefed").first()).toBeVisible({ timeout: 20_000 });

    // briefed → draft is the first allowed step (NEXT_FULFILLMENT_STATES).
    await page.getByRole("button", { name: "→ Draft" }).click();
    // Now in draft: its only next is submitted, and the Draft button is gone.
    await expect(page.getByRole("button", { name: "→ Submitted" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "→ Draft" })).toHaveCount(0);
  });

  test("RFQ: create → Award → auto-draft PO", async ({ page }) => {
    const vendor = `E2E RFQVendor ${stamp()}`;
    await createInModule(page, "/studio/procurement/vendors/new", { name: vendor });
    await createInModule(page, "/studio/procurement/rfqs/new", { title: `E2E RFQ ${stamp()}` });
    await expect(page).toHaveURL(new RegExp(`/rfqs/${UUID}`, "i"), { timeout: 20_000 });

    // Award is legal from draft → drafts a PO and redirects to it.
    await page.locator('select[name="vendor_id"]').selectOption({ label: vendor });
    await page.getByRole("button", { name: /Award/ }).click();
    await expect(page, "award drafts a PO and redirects to it").toHaveURL(
      new RegExp(`/purchase-orders/${UUID}`, "i"),
      { timeout: 30_000 },
    );
    await expect(page.getByText(/draft/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test("Budget: create → edit round-trip", async ({ page }) => {
    const name = `E2E Budget ${stamp()}`;
    await page.goto("/studio/finance/budgets/new");
    await page.locator('main [name="name"]').fill(name);
    await fillMoney(page, "5000"); // amount_cents is a required MoneyInput
    await submitAndLeaveNew(page);

    // createBudgetAction redirects to the LIST; the name cell is the row link.
    await page.getByRole("link", { name }).first().click();
    await expect(page).toHaveURL(new RegExp(`/finance/budgets/${UUID}`, "i"), { timeout: 20_000 });
    const budgetId = page.url().match(new RegExp(`/finance/budgets/(${UUID})`, "i"))![1];

    const renamed = `${name} v2`;
    await page.goto(`/studio/finance/budgets/${budgetId}/edit`);
    await page.locator('main [name="name"]').fill(renamed);
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    // updateBudget redirects to the detail; the title (h1) reflects the new name.
    await expect(page).toHaveURL(new RegExp(`/finance/budgets/${budgetId}(\\?|$)`), { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: renamed, exact: true }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("alert").filter({ hasText: /error|failed|invalid/i })).toHaveCount(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// collaborator (role=member, persona=collaborator) — authz boundaries
// ────────────────────────────────────────────────────────────────────────────
test.describe("ATLVS console deep coverage (collaborator authz)", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => {
    await suppressTour(page);
    await authedSetup(page, "collaborator");
  });

  test("Requisition Convert is hidden from a collaborator (isManagerPlus gate)", async ({ page }) => {
    // The collaborator PERSONA is admitted to requisitions_insert/_update, so it
    // can author and even approve a requisition…
    const title = `E2E CollabReq ${stamp()}`;
    await createInModule(page, "/studio/procurement/requisitions/new", { title });
    await page.getByRole("link", { name: title }).first().click();
    await expect(page).toHaveURL(new RegExp(`/requisitions/${UUID}`, "i"), { timeout: 20_000 });
    const reqId = page.url().match(new RegExp(`/requisitions/(${UUID})`, "i"))![1];

    await page.goto(`/studio/procurement/requisitions/${reqId}/edit`);
    await page.locator('select[name="requisition_state"]').selectOption("approved");
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page).toHaveURL(new RegExp(`/requisitions/${reqId}(\\?|$)`), { timeout: 20_000 });
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 20_000 });

    // …but Convert To PO is server-gated on isManagerPlus, so even at `approved`
    // it never renders for a collaborator — the manager+ gate holds, no PO drafts.
    await expect(page.getByRole("button", { name: "Convert To PO" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Convert To PO" })).toHaveCount(0);
  });

  test("Master Catalog create is blocked (settings layout gate)", async ({ page }) => {
    // /studio/settings/catalog is unlisted in settingsNav, so the settings layout
    // defaults it to the manager floor and denies a member BEFORE the manager+
    // action string is reached. The page itself is now a redirect into the
    // LEG3ND hub (decision 6 rider), but the layout gate still fires first for
    // an under-ranked role — the redirect only runs for manager+.
    await page.goto("/studio/settings/catalog/new");
    await expect(page.getByText(ACCESS_DENIED).first()).toBeVisible({ timeout: 20_000 });
  });

  test("Day Sheet create is blocked (manager+ action gate)", async ({ page }) => {
    // Operations has no layout gate → the form renders; the action rejects.
    await fillAndSubmit(page, "/studio/operations/day-sheets/new", { city: "E2E City" });
    await expect(page.getByText(/manager\+? can create day sheets/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/day-sheets\/new(\?|$)/, { timeout: 15_000 });
  });

  test("Proposal create is blocked (manager+ action gate)", async ({ page }) => {
    // Proposals has no layout gate → the form renders; createProposalAction rejects.
    await fillAndSubmit(page, "/studio/proposals/new", { title: `E2E CollabProp ${stamp()}` });
    await expect(page.getByText(/manager\+? can create proposals/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/proposals\/new(\?|$)/, { timeout: 15_000 });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// member (role=member, persona=member) — the insert-vs-grant gap
// ────────────────────────────────────────────────────────────────────────────
test.describe("ATLVS console deep coverage (member authz)", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => {
    await suppressTour(page);
    await authedSetup(page, "member");
  });

  test("Requisition create is RLS-blocked for the bare member persona", async ({ page }) => {
    // createRequisitionAction is requireSession-only (no manager+ gate) and
    // procurement has no layout gate — yet requisitions_insert RLS admits
    // owner/admin/manager/controller/collaborator and NOT the `member` persona.
    // So the INSERT is denied and the caller stays on /new with an error surface:
    // the same capability-grant-vs-RLS gap the personas ladder documents for Tasks.
    const title = `E2E MemberReq ${stamp()}`;
    await fillAndSubmit(page, "/studio/procurement/requisitions/new", { title });
    await expect(page, "member is RLS-denied requisition CREATE — stays on /new").toHaveURL(
      /\/requisitions\/new(\?|$)/,
      { timeout: 20_000 },
    );
    await expect(page.getByRole("alert").first()).toBeVisible({ timeout: 20_000 });
  });
});
