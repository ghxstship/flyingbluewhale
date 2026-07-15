/**
 * ATLVS · Finance — behavioral coverage (coverage program).
 *
 * Fills the behavioral gaps the coverage map flagged for Finance that the
 * existing deep/persona specs do NOT already exercise: the invoice edit
 * round-trip + payment FSM, the invoice/expense bulk-list mutations,
 * budget reconcile + delete, the WIP snapshot create, and the project
 * draw-schedule seed/create/toggle/delete lifecycle. Each flow drives a
 * real server-action mutation and asserts the resulting redirect/state as
 * the entitled persona (manager+ — Finance is layout-gated to manager+).
 *
 * Fixture hygiene: every created record is stamped `E2E <Thing> <ts>` and
 * purged by scripts/e2e-clean-fixtures.mjs (global teardown), so repeated
 * prod runs never accumulate. Money-bearing creates can't ride
 * `createInModule` (the required attr sits on MoneyInput's visible field,
 * the name on the hidden cents field), so they fill the `$0.00` input
 * explicitly and requestSubmit the form — the same idiom the deep-coverage
 * suite established.
 */
import { expect, test, type Page } from "./helpers/base";
import { authedSetup, suppressTour } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
const ACCESS_DENIED = /you don'?t have access/i;

/**
 * Fill every visible `<MoneyInput>` (placeholder "0.00") in the main form
 * with a dollar amount and blur the last one so its onChange/onBlur commits
 * the hidden cents value the server action reads. `createInModule` can't
 * drive MoneyInput, so money-bearing creates fill it explicitly.
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
  await expect(page).not.toHaveURL(/\/new(\?|$)/, { timeout: 75000 });
  await expect(page.getByRole("alert").filter({ hasText: /error|failed|invalid/i })).toHaveCount(0);
}

/**
 * Fill a /new form's named text/select fields, then its MoneyInput(s), then
 * submit + assert the create redirected off /new with no error surface.
 */
async function createMoneyRecord(
  page: Page,
  route: string,
  fields: Record<string, string>,
  dollars: string,
) {
  await page.goto(route);
  for (const [name, value] of Object.entries(fields)) {
    const el = page.locator(`main [name="${name}"]`).first();
    if (!(await el.count())) continue;
    const tag = await el.evaluate((e) => e.tagName);
    if (tag === "SELECT") await el.selectOption(value);
    else await el.fill(value);
  }
  await fillMoney(page, dollars);
  await submitAndLeaveNew(page);
}

/** Select the caller's freshly-created single row in a DataTable via the
 *  search box, then check "Select all on this page" (which covers exactly
 *  the one filtered-visible row) so the floating bulk-action bar appears. */
async function selectOnlyRow(page: Page, needle: string) {
  const search = page.getByLabel("Filter Rows");
  await expect(search).toBeVisible({ timeout: 30000 });
  await search.fill(needle);
  const selectAll = page.getByRole("checkbox", { name: /select all on this page/i });
  await expect(selectAll).toBeVisible({ timeout: 15000 });
  await selectAll.check();
}

test.describe("ATLVS Finance — behavioral coverage", () => {
  // The login → cold-start create → transition chains legitimately run long
  // on a serverless prod target; give them real headroom.
  test.describe.configure({ timeout: 300000 });

  // Suppress the first-run ConsoleTour scrim (z-tour, full-viewport) — it
  // intercepts every click on the /studio shell. File-scoped so the
  // addInitScript lands before the in-test login goto.
  test.beforeEach(async ({ page }) => suppressTour(page));

  // HIGH — invoice edit round-trip: updateInvoice persists a renamed title
  // and the detail masthead reflects it (also exercises the optimistic-
  // concurrency `_updated_at` token + the line-item reconcile pass on 0 rows).
  test("manager: edit an invoice and the detail reflects the new title", async ({ page }) => {
    await authedSetup(page, "manager");
    const title = `E2E Invoice ${stamp()}`;
    await createMoneyRecord(page, "/studio/finance/invoices/new", { title }, "1234.56");
    // createInvoiceAction redirects to the DETAIL page.
    await expect(page).toHaveURL(new RegExp(`/studio/finance/invoices/${UUID.source}`), { timeout: 90000 });
    const invoiceId = page.url().match(new RegExp(`/invoices/(${UUID.source})`))![1];

    const renamed = `${title} v2`;
    await page.goto(`/studio/finance/invoices/${invoiceId}/edit`);
    // Wait for the edit FormShell to mount before filling + requestSubmit —
    // firing submit against a half-rendered form leaves the page on /edit.
    const titleInput = page.locator('main [name="title"]');
    await expect(titleInput).toBeVisible({ timeout: 15000 });
    await titleInput.fill(renamed);
    // A freshly-created invoice has NO line items, so InvoiceLineItemsEditor
    // seeds ONE blank row (`initial.length === 0 ? [blankRow()]`). That row's
    // `li_description_N` Input is `required` and empty, so `requestSubmit()`'s
    // HTML constraint validation blocks the submit and the page never leaves
    // /edit. Drop the blank row (matching this test's 0-line-item reconcile
    // intent — see the header comment) so the form validates and submits.
    const removeLine = page.getByRole("button", { name: /remove line/i });
    while (await removeLine.count()) {
      await removeLine.first().click();
    }
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    // updateInvoice redirects back to the detail; the h1 shows the new title.
    await expect(page).toHaveURL(new RegExp(`/studio/finance/invoices/${invoiceId}(\\?|$)`), { timeout: 90000 });
    await expect(page.getByRole("heading", { name: renamed }).first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("alert").filter({ hasText: /error|failed|invalid/i })).toHaveCount(0);
  });

  // HIGH — the invoice payment FSM: draft → sent → paid via the header
  // InvoiceStatusControls (setInvoiceStatusAction stamps paid_at). NEXT[paid]
  // is null, so both transition controls vanish once paid — the terminal proof.
  test("manager: an invoice walks draft → sent → paid (terminal)", async ({ page }) => {
    await authedSetup(page, "manager");
    const title = `E2E Invoice ${stamp()}`;
    await createMoneyRecord(page, "/studio/finance/invoices/new", { title }, "500.00");
    await expect(page).toHaveURL(new RegExp(`/studio/finance/invoices/${UUID.source}`), { timeout: 90000 });

    // draft → sent. Each control re-renders via revalidatePath, so wait for
    // the NEXT label to confirm the transition committed.
    await page.getByRole("button", { name: /send invoice/i }).click();
    await expect(page.getByRole("button", { name: /mark paid/i })).toBeVisible({ timeout: 30000 });
    // sent → paid.
    await page.getByRole("button", { name: /mark paid/i }).click();
    // Terminal: no forward transition renders; Send + Mark Paid are both gone.
    await expect(page.getByRole("button", { name: /mark paid/i })).toHaveCount(0, { timeout: 30000 });
    await expect(page.getByRole("button", { name: /send invoice/i })).toHaveCount(0);
  });

  // MEDIUM — bulk void from the invoice list table (bulkVoidInvoices). A
  // danger-variant bulk action, so the selection routes through the
  // ConfirmDialog before the write; a fresh draft voids cleanly (0 skipped).
  test("manager: bulk-void an invoice from the list table", async ({ page }) => {
    await authedSetup(page, "manager");
    const s = stamp();
    const title = `E2E Invoice ${s}`;
    await createMoneyRecord(page, "/studio/finance/invoices/new", { title }, "250.00");
    await expect(page).toHaveURL(new RegExp(`/studio/finance/invoices/${UUID.source}`), { timeout: 90000 });

    await page.goto("/studio/finance/invoices");
    await selectOnlyRow(page, s);
    // Fire the danger bulk action; confirm in the alertdialog.
    await page.getByRole("toolbar", { name: /bulk actions/i }).getByRole("button", { name: /^void$/i }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: /^void$/i }).click();
    await expect(page.getByText(/1 Invoice Voided/i)).toBeVisible({ timeout: 30000 });
  });

  // HIGH — the core expense-review ops path: multi-select pending expenses →
  // approved from the list table (bulkApproveExpenses). A manager both logs
  // and approves the expense here (createExpenseAction is not manager-gated;
  // the bulk review is).
  test("manager: bulk-approve a pending expense from the list", async ({ page }) => {
    await authedSetup(page, "manager");
    const s = stamp();
    const desc = `E2E Expense ${s}`;
    await createMoneyRecord(page, "/studio/finance/expenses/new", { description: desc }, "42.00");
    // createExpenseAction redirects to the LIST.
    await expect(page).toHaveURL(/\/studio\/finance\/expenses(\?|$)/, { timeout: 90000 });

    await selectOnlyRow(page, s);
    await page.getByRole("toolbar", { name: /bulk actions/i }).getByRole("button", { name: /^approve$/i }).click();
    await expect(page.getByText(/1 Expense Approved/i)).toBeVisible({ timeout: 30000 });
  });

  // MEDIUM — budget reconcile-to-actuals: reconcileBudget recomputes spend
  // from matching expenses/paid invoices and writes it back. With a matching
  // department expense present, the pre-reconcile detail shows a non-zero
  // variance vs the (zero) stored figure ("Reconcile to clear"); after the
  // reconcile the stored figure catches up and the variance clears.
  test("manager: reconcile a budget to actuals clears the stored variance", async ({ page }) => {
    await authedSetup(page, "manager");
    const s = stamp();
    const budgetName = `E2E Budget ${s}`;
    // Budget scoped by XPMS department only (no project) so the reconcile
    // aggregates the matching-department expense below.
    await createMoneyRecord(page, "/studio/finance/budgets/new", { name: budgetName, department: "Hospitality" }, "5000");
    await expect(page).toHaveURL(/\/studio\/finance\/budgets(\?|$)/, { timeout: 90000 });
    // A matching-department expense guarantees computed spend > 0.
    await createMoneyRecord(
      page,
      "/studio/finance/expenses/new",
      { description: `E2E Expense ${s}`, department: "Hospitality" },
      "125.00",
    );
    await expect(page).toHaveURL(/\/studio\/finance\/expenses(\?|$)/, { timeout: 90000 });

    // Open the budget detail from the list (createBudgetAction redirected to
    // the list; the name cell is the row link).
    await page.goto("/studio/finance/budgets");
    await page.getByRole("link", { name: budgetName }).first().click();
    await expect(page).toHaveURL(new RegExp(`/studio/finance/budgets/${UUID.source}`), { timeout: 30000 });

    // Stored spend is 0 but computed > 0 → the variance prompts a reconcile.
    await expect(page.getByText(/reconcile to clear/i)).toBeVisible({ timeout: 20000 });
    await page.getByRole("button", { name: /reconcile to actuals/i }).click();
    // After reconcile the stored figure == computed → variance clears.
    await expect(page.getByText(/reconcile to clear/i)).toHaveCount(0, { timeout: 30000 });
  });

  // LOW — budget delete from the detail surface (deleteBudget) → redirect to
  // the list, row gone. DeleteForm confirms in a Radix dialog before firing.
  // Run as OWNER: `budgets_delete` RLS is intentionally an ['owner','admin']
  // band (the 20260625144337 manager-grant sweep deliberately left DELETE
  // narrower — "no manager hard-delete path"). A manager's delete would be
  // silently RLS-filtered (0 rows, no error) and the row would survive the
  // toHaveCount(0) assert. The manager-denial gate is covered by the member
  // test below; here we exercise the entitled delete success path.
  test("owner: delete a budget from its detail page", async ({ page }) => {
    await authedSetup(page, "owner");
    const budgetName = `E2E Budget ${stamp()}`;
    await createMoneyRecord(page, "/studio/finance/budgets/new", { name: budgetName }, "3000");
    await expect(page).toHaveURL(/\/studio\/finance\/budgets(\?|$)/, { timeout: 90000 });
    await page.getByRole("link", { name: budgetName }).first().click();
    await expect(page).toHaveURL(new RegExp(`/studio/finance/budgets/${UUID.source}`), { timeout: 30000 });

    // DeleteForm: open the confirm dialog, wait for it, then confirm inside it.
    await page.getByRole("button", { name: /^delete$/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await dialog.getByRole("button", { name: /^delete$/i }).click();
    // deleteBudget redirects to the list; the deleted row is gone.
    await page.waitForURL((u) => /\/studio\/finance\/budgets$/.test(u.pathname), { timeout: 90000 });
    await expect(page.getByRole("link", { name: budgetName })).toHaveCount(0, { timeout: 20000 });
  });

  // MEDIUM — createWipSnapshot behavioral: submitting the new-snapshot form
  // materialises a wip_snapshots row and redirects to the WIP list. The form's
  // money fields are plain numeric dollars (NOT MoneyInput), so createInModule
  // drives them fine; project_id is the required select it auto-satisfies.
  test("manager: create a WIP snapshot lands on the WIP list", async ({ page }) => {
    await authedSetup(page, "manager");
    // The WIP New form's project select is REQUIRED (`<select name="project_id"
    // required>`). createInModule can only satisfy a required select that has a
    // non-empty option — a fixture org with no projects would leave project_id
    // unset and the form would never submit off /new. Seed a throwaway project
    // inline so the option set is guaranteed non-empty (manager is in the
    // projects_insert band; teardown cascades the E2E project).
    await createInModule(page, "/studio/projects/new", { name: `E2E WIPProj ${stamp()}` });
    await expect(page).toHaveURL(new RegExp(`/studio/projects/${UUID.source}`), { timeout: 90000 });

    await createInModule(page, "/studio/finance/wip/new", { notes: `E2E WIP ${stamp()}` });
    await expect(page).toHaveURL(/\/studio\/finance\/wip(\?|$)/, { timeout: 90000 });
    await expect(page.getByRole("alert").filter({ hasText: /error|failed|invalid/i })).toHaveCount(0);
  });

  // MEDIUM — the project draw-schedule lifecycle: seedDefaultDraws seeds the
  // 50/30/20 standard schedule, toggleDrawn flips a draw drawn/pending, and
  // createDraw + deleteDraw round-trip a custom line. All on a throwaway
  // E2E project so the schedule (project_billing_draws) cascades on teardown.
  test("manager: seed, toggle, add and delete project draws", async ({ page }) => {
    await authedSetup(page, "manager");
    await createInModule(page, "/studio/projects/new", { name: `E2E FinanceDraws ${stamp()}` });
    await expect(page).toHaveURL(new RegExp(`/studio/projects/${UUID.source}`), { timeout: 90000 });
    const projectId = page.url().match(new RegExp(`/studio/projects/(${UUID.source})`))![1];

    await page.goto(`/studio/projects/${projectId}/finance/draws`);
    // Seed only renders when the schedule is empty; a fresh project qualifies.
    await page.getByRole("button", { name: /seed 50 ?\/ ?30 ?\/ ?20 default/i }).click();
    const depositRow = page.locator("tr", { hasText: "Mobilization deposit" });
    await expect(depositRow).toBeVisible({ timeout: 30000 });

    // Toggle the deposit draw drawn → the state badge flips + the control
    // relabels to "Mark pending".
    await depositRow.getByRole("button", { name: /mark drawn/i }).click();
    await expect(depositRow.getByText(/^Drawn$/i)).toBeVisible({ timeout: 30000 });

    // Add a custom stamped draw, then delete it.
    const drawName = `E2E Draw ${stamp()}`;
    await page.locator('main [name="draw_name"]').fill(drawName);
    await page.locator('main [name="percentage"]').fill("10");
    await page.getByRole("button", { name: /^add draw$/i }).click();
    const customRow = page.locator("tr", { hasText: drawName });
    await expect(customRow).toBeVisible({ timeout: 30000 });
    await customRow.getByRole("button", { name: /^delete$/i }).click();
    await expect(page.locator("tr", { hasText: drawName })).toHaveCount(0, { timeout: 30000 });
  });

  // MEDIUM/gated-denial — the Finance area is layout-gated to manager+
  // (FinanceLayout → AccessDenied for members), so a member never reaches the
  // invoice/expense surfaces or their mutations. Defence-in-depth over the
  // per-action isManagerPlus checks.
  test("member: the Finance area is denied (manager+ layout gate)", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/studio/finance/invoices");
    await expect(page.getByText(ACCESS_DENIED).first()).toBeVisible({ timeout: 30000 });
    await page.goto("/studio/finance/expenses");
    await expect(page.getByText(ACCESS_DENIED).first()).toBeVisible({ timeout: 30000 });
  });
});
