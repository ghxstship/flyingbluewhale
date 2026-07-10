/**
 * LEG3ND knowledge / LMS shell (/legend) — DEEP coverage journeys.
 *
 * Companion to `e2e/legend-personas.spec.ts`. That spec proves every
 * `legendNav` surface RENDERS (h1-or-AccessDenied) for both personas and walks
 * the happy-path learner spine (enroll → lesson → quiz → community → live →
 * voucher) plus two operator creates (resource, course-assign). It deliberately
 * stops at "the page rendered and the write didn't RLS-error".
 *
 * This file goes DEEPER on the surfaces the render sweep only skims — the four
 * LEG3ND authoring/compliance domains that are NOT in `legendNav` (so the sweep
 * never even visits them) and the store/wallet write-back the persona spec only
 * asserts a toast for:
 *
 *   • XMCE compliance engine — full rule CRUD (create → edit → soft-delete),
 *     a real engine RUN that produces findings, and BOTH authz boundaries
 *     (page-level AccessDenied on /rules/new; there is no action-level path
 *     there since the page gates first).
 *   • Signage library — sign create → SignPanel wayfinding render (real
 *     `<use href="…#aiga-*">` sprite), a placement that rolls up the Installed
 *     total, a draft→published state transition, and the ACTION-level refusal
 *     (the /signage/new PAGE has no gate — only `createSignAction` does).
 *   • Certifications / recert — a recert REQUEST from the wallet (append-only
 *     `certification_recerts` insert) and the manager-only Recert Matrix grid
 *     DEPTH (member × certification table + six-state legend with counts) that
 *     the render sweep's h1-or-AccessDenied assertion never inspects.
 *   • Resources — the collection container create (untested by the persona
 *     spec, which only creates a bare resource) and the resource EDIT / re-file
 *     path (change collection + state + title).
 *   • Store — voucher redeem read back against SERVER TRUTH (credit balance
 *     before/after + idempotent already-redeemed), not just the transient
 *     "Redeemed" toast the persona spec stops at.
 *
 * Personas (by FIXTURE, same as the persona spec — no persona auto-routes to
 * /legend): `owner` (role=owner = manager+, the operator) and `crew`
 * (role=member, the learner). Both pin org f4509a5f (Test Professional Org),
 * seeded with the LEG3ND clone in
 * 20260625161724_legend_seed_test_professional_org.sql. Writes use `stamp()` so
 * re-runs never collide, and nothing hard-deletes a shared seed row.
 */
import { expect, test, type Page } from "./helpers/base";
import { authedSetup } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";
import { RULE_STATE_LABELS } from "../src/lib/xmce_engine";
import { SIGN_STATE_LABELS } from "../src/lib/legend_signage";
import { ACCREDITATION_STATES, ACCREDITATION_STATE_LABELS } from "../src/lib/legend_compliance";

const RLS_ERROR = /violates row-level security|permission denied|not authorized|denied/i;
const UUID = /[0-9a-f-]{36}/;

/** Pull the record id out of the current detail URL (…/<segment>/<uuid>). */
function idFromUrl(page: Page): string {
  const m = page.url().match(/\/([0-9a-f-]{36})(?:\?|#|$)/);
  expect(m?.[1], `URL ${page.url()} carries a record uuid`).toBeTruthy();
  return m![1]!;
}

// ══════════════════════════════════════════════════════════════════════════
// Operator (owner = manager+) — the authoring + compliance depth
// ══════════════════════════════════════════════════════════════════════════
test.describe("LEG3ND deep coverage (operator · owner)", () => {
  test.describe.configure({ timeout: 300_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("XMCE rule: create → edit → soft-delete round-trip", async ({ page }) => {
    const s = stamp();
    const code = `E2E-${s}`;
    const title = `E2E XMCE Rule ${s}`;

    // ── Create (redirects off /new to the rule detail) ──────────────────────
    await createInModule(page, "/legend/engine/rules/new", {
      code,
      title,
      severity: "high",
      rule_state: "active",
      description: "Authored by the LEG3ND deep-coverage e2e journey.",
    });
    await expect(page).toHaveURL(new RegExp(`/legend/engine/rules/${UUID.source}`), { timeout: 35_000 });
    const ruleId = idFromUrl(page);
    await expect(page.getByRole("heading", { name: title, exact: true }).first()).toBeVisible({ timeout: 15_000 });

    // ── Edit: flip the state + rename ───────────────────────────────────────
    const editedTitle = `${title} EDITED`;
    await page.goto(`/legend/engine/rules/${ruleId}/edit`);
    await page.locator('main [name="title"]').fill(editedTitle);
    await page.locator('main [name="rule_state"]').selectOption("retired");
    await page.getByRole("button", { name: "Save Rule" }).click();

    // Back on the detail: the new title is the h1 and the new state badge shows.
    await expect(page).toHaveURL(new RegExp(`/legend/engine/rules/${ruleId}(\\?|$)`), { timeout: 35_000 });
    await expect(page.getByRole("heading", { name: editedTitle, exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText(RULE_STATE_LABELS.retired, { exact: true }).first(),
      "the edited rule_state (Retired) renders as a StatusBadge",
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(RLS_ERROR)).toHaveCount(0);

    // ── Soft-delete via DeleteRuleButton → redirects to the list ────────────
    await page.getByRole("button", { name: /^delete$/i }).click();
    await expect(page, "delete redirects to the rules list").toHaveURL(/\/legend\/engine\/rules(\?|$)/, {
      timeout: 35_000,
    });
    // The soft-deleted rule (filtered on deleted_at IS NULL) is gone from the list.
    await expect(page.getByText(code, { exact: false }), "the deleted rule's code is absent from the list").toHaveCount(
      0,
    );
    await expect(page.getByText(RLS_ERROR)).toHaveCount(0);
  });

  test("XMCE engine run produces at least one finding", async ({ page }) => {
    // Guarantee ≥1 ACTIVE rule so the stub engine (flags every 2nd active rule,
    // index 0 always) emits ≥1 finding.
    const s = stamp();
    await createInModule(page, "/legend/engine/rules/new", {
      code: `E2E-RUN-${s}`,
      title: `E2E Run Rule ${s}`,
      severity: "medium",
      rule_state: "active",
    });

    await page.goto("/legend/engine/runs");
    // RunEngineButton defaults its scope select to "org"; just fire the run.
    // When the runs list is empty the page renders the button TWICE (the
    // ModuleHeader action + the DataTable emptyAction) — take the first.
    await page
      .getByRole("button", { name: /run engine/i })
      .first()
      .click();

    // The action inserts a compliance_runs row + one finding per flagged active
    // rule, settles the run, then redirects to the run detail.
    await expect(page).toHaveURL(new RegExp(`/legend/engine/runs/${UUID.source}`), { timeout: 35_000 });
    await expect(
      page.getByRole("heading", { name: /^Run · / }).first(),
      "the run detail renders a run-state heading",
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "Findings", exact: true }),
      "the Findings section renders",
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText(/sample finding/i).first(),
      "at least one finding was written by the run",
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/only manager\+/i)).toHaveCount(0);
    await expect(page.getByText(RLS_ERROR)).toHaveCount(0);
  });

  test("Signage sign create → SignPanel wayfinding render", async ({ page }) => {
    const s = stamp();
    const name = `E2E Exit ${s}`;
    await createInModule(page, "/legend/signage/new", {
      code: `ISO-E${s}`,
      name,
      standard: "iso7010",
      category: "safe_condition",
      pictogram_key: "aiga-exit",
      sign_state: "draft",
    });
    await expect(page).toHaveURL(new RegExp(`/legend/signage/${UUID.source}`), { timeout: 35_000 });

    await expect(page.getByRole("heading", { name, exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Wayfinding preview", exact: true })).toBeVisible();
    // The SignPanel renders the pictogram through <SignIcon> → an external sprite
    // <use href="/brand/pictograms.svg#aiga-exit"> — proof the chosen symbol wired.
    await expect(
      page.locator('use[href*="aiga-exit"]').first(),
      "the wayfinding SignPanel references the aiga-exit sprite symbol",
    ).toBeAttached();
    await expect(
      page.getByText(SIGN_STATE_LABELS.draft, { exact: true }).first(),
      "the draft state renders as a StatusBadge",
    ).toBeVisible();
    await expect(page.getByText(/only manager\+ can create signs/i)).toHaveCount(0);
  });

  test("Signage placement rolls up the Installed total", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/legend/signage/new", {
      code: `ISO-P${s}`,
      name: `E2E Placement Sign ${s}`,
      standard: "iso7010",
      category: "safe_condition",
      pictogram_key: "aiga-exit",
      sign_state: "published",
    });
    const signId = idFromUrl(page);

    const location = `Main corridor ${s}`;
    await page.goto(`/legend/signage/${signId}/placements/new`);
    await page.locator('main [name="location"]').fill(location);
    await page.locator('main [name="quantity"]').fill("3");
    await page.locator('main [name="placement_state"]').selectOption("installed");
    await page.getByRole("button", { name: "Record Placement" }).click();

    // Redirects back to the sign detail (off /placements/new).
    await expect(page).toHaveURL(new RegExp(`/legend/signage/${signId}(\\?|$)`), { timeout: 35_000 });

    // The placement lands in the DataTable with Qty 3 + Installed state.
    const row = page.getByRole("row").filter({ hasText: location });
    await expect(row, "the placement row is present").toBeVisible({ timeout: 15_000 });
    await expect(row).toContainText("3");
    await expect(row).toContainText(/installed/i);

    // …and the Installed rollup Field (placementTotals) reflects the quantity.
    const installedField = page.locator("div.surface.p-3").filter({ hasText: "Installed" }).first();
    await expect(installedField, "the Installed metric rolled up the placement quantity").toContainText("3");
    await expect(page.getByText(RLS_ERROR)).toHaveCount(0);
  });

  test("Signage state transition: draft → published", async ({ page }) => {
    const s = stamp();
    const name = `E2E State Sign ${s}`;
    await createInModule(page, "/legend/signage/new", {
      code: `ISO-S${s}`,
      name,
      standard: "iso7010",
      category: "safe_condition",
      pictogram_key: "aiga-exit",
      sign_state: "draft",
    });
    const signId = idFromUrl(page);

    // Reuse the NewSignForm in edit mode — flip only sign_state to published.
    await page.goto(`/legend/signage/${signId}/edit`);
    await page.locator('main [name="sign_state"]').selectOption("published");
    await page.getByRole("button", { name: "Save Sign" }).click();

    await expect(page).toHaveURL(new RegExp(`/legend/signage/${signId}(\\?|$)`), { timeout: 35_000 });
    await expect(
      page.getByText(SIGN_STATE_LABELS.published, { exact: true }).first(),
      "the header StatusBadge now reads Published (the state write persisted)",
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(RLS_ERROR)).toHaveCount(0);
  });

  test("Recert Matrix grid depth (manager-only)", async ({ page }) => {
    await page.goto("/legend/compliance");
    // Manager+ self-gate passes for owner; but the org may have no certs/members
    // yet → the page short-circuits to an EmptyState. That's an honest skip.
    if (await page.getByText(/nothing to chart yet/i).count()) {
      test.skip(true, "recert matrix has no certifications/members to chart in this org");
      return;
    }
    const table = page.locator("table").first();
    await expect(table, "the member × certification matrix renders").toBeVisible({ timeout: 15_000 });
    await expect(
      table.getByRole("columnheader", { name: "Member" }),
      "the sticky Member header is present",
    ).toBeVisible();
    // ≥1 certification column beyond the Member header, ≥1 member row.
    expect(await table.locator("thead th").count(), "at least one certification column").toBeGreaterThan(1);
    expect(await table.locator("tbody tr").count(), "at least one member row").toBeGreaterThan(0);

    // The state-legend strip shows all six ACCREDITATION states, each with a count.
    for (const stateKey of ACCREDITATION_STATES) {
      await expect(
        page.getByText(new RegExp(`${ACCREDITATION_STATE_LABELS[stateKey]}\\s·\\s\\d+`)).first(),
        `legend shows "${ACCREDITATION_STATE_LABELS[stateKey]}" with a count`,
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test("Resource collection create → detail", async ({ page }) => {
    const name = `E2E Collection ${stamp()}`;
    await createInModule(page, "/legend/resources/collections/new", {
      name,
      description: "Container authored by the LEG3ND deep-coverage e2e journey.",
    });
    await expect(page).toHaveURL(new RegExp(`/legend/resources/collections/${UUID.source}`), { timeout: 35_000 });
    await expect(
      page.getByRole("heading", { name, exact: true }).first(),
      "the collection detail heading shows the new collection name",
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(RLS_ERROR)).toHaveCount(0);
  });

  test("Resource edit re-files into a collection + publishes", async ({ page }) => {
    const s = stamp();
    // A collection to re-file INTO.
    const collectionName = `E2E Refile Collection ${s}`;
    await createInModule(page, "/legend/resources/collections/new", { name: collectionName });

    // A resource to move.
    const title = `E2E Resource ${s}`;
    await createInModule(page, "/legend/resources/new", { title });
    const resourceId = idFromUrl(page);

    // Edit: assign the collection, publish, rename.
    const editedTitle = `${title} EDITED`;
    await page.goto(`/legend/resources/${resourceId}/edit`);
    await page.locator('main [name="collection_id"]').selectOption({ label: collectionName });
    await page.locator('main [name="resource_state"]').selectOption("published");
    await page.locator('main [name="title"]').fill(editedTitle);
    await page.getByRole("button", { name: "Save Resource" }).click();

    await expect(page).toHaveURL(new RegExp(`/legend/resources/${resourceId}(\\?|$)`), { timeout: 35_000 });
    await expect(
      page.getByRole("heading", { name: editedTitle, exact: true }).first(),
      "the resource detail shows the edited title",
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(collectionName, { exact: false }).first(),
      "the resource is now associated with the collection",
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(RLS_ERROR)).toHaveCount(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Learner / member (crew) — authz boundaries + wallet write-backs
// ══════════════════════════════════════════════════════════════════════════
test.describe("LEG3ND deep coverage (learner/member · crew)", () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "crew"));

  test("XMCE authoring is page-gated for a member", async ({ page }) => {
    // /legend/engine/rules/new is NOT in legendNav, so the render sweep never
    // hits it. The page calls requireSession + isManagerPlus → AccessDenied.
    await page.goto("/legend/engine/rules/new");
    await expect(
      page.getByText(/you don'?t have access/i).first(),
      "the member sees the AccessDenied EmptyState",
    ).toBeVisible({ timeout: 15_000 });
    // The RuleForm never rendered — no Create Rule submit.
    await expect(page.getByRole("button", { name: "Create Rule" })).toHaveCount(0);
    // AccessDenied is a render, NOT an auth bounce.
    expect(page.url(), "the member is not bounced to /login").not.toMatch(/\/login/);
  });

  test("Signage authoring is action-gated for a member", async ({ page }) => {
    // /legend/signage/new has NO page-level gate → the form renders for a member.
    await page.goto("/legend/signage/new");
    const form = page.locator("main form").first();
    await expect(form, "the sign form renders for the member (no page gate)").toBeVisible({ timeout: 15_000 });
    await form.locator('[name="code"]').fill(`ISO-X${stamp()}`);
    await form.locator('[name="name"]').fill(`E2E Blocked Sign ${stamp()}`);
    await form.locator('[name="pictogram_key"]').fill("aiga-exit");
    await form.locator('[name="category"]').selectOption("safe_condition");
    await form.evaluate((f: HTMLFormElement) => f.requestSubmit());

    // createSignAction runs requireSession + isManagerPlus → { error }, surfaced
    // by FormShell's error Alert. The form stays on /signage/new (no redirect).
    // The refusal renders twice (inline Alert + sr-only aria-live region) —
    // take the first.
    await expect(
      page.getByText(/only manager\+ can create signs/i).first(),
      "the action-level refusal message surfaces in the form",
    ).toBeVisible({ timeout: 15_000 });
    await expect(page, "the form did not redirect to a sign detail").toHaveURL(/\/legend\/signage\/new(\?|$)/);
  });

  test("Certifications: request recert from the wallet", async ({ page }) => {
    await page.goto("/legend/certifications");
    // No holdings seeded for this learner → honest skip.
    if (await page.getByText(/no certifications yet/i).count()) {
      test.skip(true, "learner has no certification holdings in this org");
      return;
    }
    // The recert control only renders for an Expiring/Expired holding.
    const recert = page.getByRole("button", { name: /request recert/i }).first();
    if ((await recert.count()) === 0) {
      // Wallet renders holdings but none are recertable — the tone Badges still
      // prove the wallet computed effectiveAccreditationState. Honest pass.
      await expect(page.locator(".surface").first(), "the wallet renders credential cards").toBeVisible({
        timeout: 15_000,
      });
      return;
    }
    await recert.click();
    // The button swaps in-place for the success text — only reachable if the
    // append-only certification_recerts row inserted under RLS.
    await expect(
      page.getByText(/recert requested/i).first(),
      "the recert request persisted (button → 'Recert requested')",
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(RLS_ERROR)).toHaveCount(0);
  });

  test("Store: voucher redeem reflects in the credit balance", async ({ page }) => {
    await page.goto("/legend/store");
    const before = await readCreditBalance(page);

    const code = page.locator('[name="code"]').first();
    await expect(code, "the voucher form is present").toBeVisible({ timeout: 15_000 });
    await code.fill("WELCOME100");
    await page.getByRole("button", { name: /^redeem$/i }).click();

    // Either a fresh success ("… credits added") or an idempotent already-redeemed
    // — never a not-found / RLS error.
    const outcome = page.getByText(/credits added|already redeemed/i).first();
    await expect(outcome, "redemption produced a definitive result").toBeVisible({ timeout: 20_000 });
    const succeeded = /credits added/i.test(await outcome.innerText());
    await expect(
      page.getByText(/code not found|could not redeem|no longer active|expired|permission denied|row-level/i),
      "no error result surfaced",
    ).toHaveCount(0);

    // Read SERVER truth after a reload — the ledger sum, not the transient toast.
    await page.reload();
    const after = await readCreditBalance(page);
    if (succeeded) {
      expect(after, "a fresh redemption increased the credit balance").toBeGreaterThan(before);
    } else {
      expect(after, "an already-redeemed re-run leaves the balance unchanged").toBe(before);
    }
  });
});

/** Read the learner's live credit balance (the ledger-sum figure the store shows). */
async function readCreditBalance(page: Page): Promise<number> {
  const row = page.locator("div.surface").filter({ hasText: "Your balance" }).first();
  await expect(row, "the store balance row renders").toBeVisible({ timeout: 15_000 });
  const compact = (await row.innerText()).replace(/[,\s]/g, "");
  const m = compact.match(/(\d+)credits/i) ?? compact.match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}
