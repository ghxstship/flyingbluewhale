/**
 * ATLVS · Procurement — behavioral coverage (coverage program, procurement wave).
 *
 * Fills the behavioral gaps the coverage map flagged for Procurement that the
 * existing render/deep specs do NOT already exercise. Each flow drives a real
 * mutation FSM / record action to its materialised target and asserts the
 * redirect, as the entitled persona. The domain is almost entirely manager-
 * gated (isManagerPlus), so the negative leg is a member hitting the app-layer
 * money-write gate.
 *
 * Already covered elsewhere (do NOT re-author): requisition create→approve→
 * Convert-To-PO, RFQ create→Award→auto-draft-PO, PO fulfill chain, master-
 * catalog create+toggle, collaborator Convert gated-denial, member requisition
 * RLS-block (all in atlvs-deep-coverage.spec).
 *
 * NOT covered here — the "Route To Approvals" record actions (PO + PO change
 * order) were drafted but REMOVED: `routeToApprovals` (src/lib/approvals/route.ts)
 * inserts into `public.approval_instances`, which has RLS enabled with ONLY a
 * SELECT policy (`uas_inst_org`) and no INSERT/ALL policy in any migration — so
 * the authed-client insert is denied for every persona, the action returns an
 * error toast (never a redirect), and the flow cannot be driven to its
 * governance/approvals detail from the UI. Re-add once approval_instances gains
 * a write policy (see supabase/migrations baseline §RLS).
 *
 * Fixture hygiene: every created record is stamped and purged by
 * scripts/e2e-clean-fixtures.mjs (global teardown):
 *   • requisitions + the rfqs it converts into → title "E2E ReqRFQ %"
 * The member PO-create leg is gate-blocked and materialises no row.
 * So repeated prod runs never accumulate.
 */
import { expect, test } from "./helpers/base";
import { authedSetup, suppressTour } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

test.describe("ATLVS Procurement — behavioral coverage", () => {
  // Multi-step create → transition → redirect chains run long on a serverless
  // prod target (cold-start on the first heavy create); give them headroom.
  test.describe.configure({ timeout: 300000 });

  // Suppress the first-run ConsoleTour scrim (z-tour, full-viewport) — it
  // intercepts clicks on the /studio shell and hangs the action buttons.
  // File-scoped so the addInitScript lands before the in-test login goto.
  test.beforeEach(async ({ page }) => suppressTour(page));

  // HIGH — the sibling sourcing branch of Convert-To-PO. A submitted
  // requisition opens competitive sourcing: manager+ drafts an rfqs row and
  // the requisition's procurement spine advances. Gate is manager+ AND
  // requisition_state ∈ {submitted, approved}.
  test("manager: a submitted requisition converts to a materialised RFQ", async ({ page }) => {
    await authedSetup(page, "manager");
    const title = `E2E ReqRFQ ${stamp()}`;
    await createInModule(page, "/studio/procurement/requisitions/new", { title });

    // createReqAction redirects to the LIST (not the detail) — click the
    // stamped row (its title cell renders as a Link to the record) to reach
    // the detail, then capture the id from the URL.
    await expect(page).toHaveURL(/\/studio\/procurement\/requisitions(\?|$)/, { timeout: 90000 });
    const row = page.getByRole("link", { name: title });
    await expect(row).toBeVisible({ timeout: 30000 });
    await row.click();
    await expect(page).toHaveURL(new RegExp(`/studio/procurement/requisitions/${UUID.source}`), { timeout: 90000 });
    const reqId = page.url().match(new RegExp(`/requisitions/(${UUID.source})`))![1];

    // Convert To RFQ is server-gated on requisition_state ∈ {submitted,approved};
    // advance it via the edit form (manager is admitted to requisitions_update).
    await page.goto(`/studio/procurement/requisitions/${reqId}/edit`);
    await page.locator('main select[name="requisition_state"]').selectOption("submitted");
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page).toHaveURL(new RegExp(`/requisitions/${reqId}(\\?|$)`), { timeout: 90000 });

    // Now manager+ on a submitted requisition sees "Convert To RFQ" → drafts + redirects.
    const convert = page.getByRole("button", { name: /convert to rfq/i });
    await expect(convert).toBeVisible({ timeout: 30000 });
    await convert.click();
    await expect(page).toHaveURL(new RegExp(`/studio/procurement/rfqs/${UUID.source}`), { timeout: 90000 });
  });

  // MEDIUM — the app-layer manager gate on money-committing PO writes. A
  // member reaches the create form (it's not route-gated) but createPoAction
  // returns the isManagerPlus server-gate error — surfaced as the FormShell
  // alert, and the create never redirects off /new.
  test("member: PO create is blocked by the manager gate", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/studio/procurement/purchase-orders/new");
    await page.locator('main [name="title"]').first().fill(`E2E PO ${stamp()}`);
    await page.locator('main [name="amount"]').first().fill("1500");
    await page
      .locator("main form")
      .first()
      .evaluate((f: HTMLFormElement) => f.requestSubmit());

    // The gate error ("Only manager+ can create purchase orders") lands in the
    // error Alert (role=alert). `.first()` avoids a strict-mode match against a
    // second live-region node, and we stay on the /new form (no PO created).
    await expect(page.getByRole("alert").filter({ hasText: /manager/i }).first()).toBeVisible({ timeout: 30000 });
    await expect(page).toHaveURL(/\/purchase-orders\/new(\?|$)/);
  });
});
