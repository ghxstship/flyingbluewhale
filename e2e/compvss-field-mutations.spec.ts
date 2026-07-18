/**
 * COMPVSS field mutations — behavioral coverage for the kit 31/32/33 mobile
 * workflows that the render-tier kit specs (compvss-kit31-32-surfaces,
 * compvss-kit33-surfaces) only NAVIGATE, never DRIVE. Flagged UNCOVERED by the
 * 2026-07-18 coverage-gap sweep:
 *   - Field template create (kit 31) — /m/templates/new → field_templates
 *   - Shift scheduler create (kit 32) — /m/scheduler New Shift → shifts (draft)
 *   - Mobile roster assign (kit 30) — /m/roster/assign → offer_letters engagement
 *
 * Prod-safe by construction: template create fires no push; the shift is created
 * DRAFT and never published (publish is the only scheduler push path); mobile
 * assign's offer letter routes its only notification to our own test manager.
 * Fixture hygiene: field_templates (E2E Template%), shifts (role E2E %), and the
 * assigned crew (E2E Recruit%, letters-first) are purged by e2e-clean-fixtures.
 */
import { expect, test, type Page } from "./helpers/base";
import { authedSetup } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

const ERROR_BOUNDARY = /something went wrong|application error|unhandled|digest:/i;

// FormScreen (src/components/mobile/kit/FormScreen.tsx) renders each field as a
// `.fld` wrapping a bare <label> + an unnamed control (React-controlled, no
// name attr). Resolve the control through its label text.
function fld(page: Page, label: string) {
  return page.locator(".fld").filter({ has: page.locator("label", { hasText: label }) });
}

test.describe("COMPVSS · field template create (kit 31)", () => {
  test.describe.configure({ timeout: 180_000 });

  test("manager: creates a reusable field template", async ({ page }) => {
    await authedSetup(page, "manager");
    await page.goto("/m/templates/new");
    const name = `E2E Template ${stamp()}`;
    await fld(page, "Template Name").locator("input").fill(name);
    // Category is exactly 8 options → a native <select> (PICKER_DRAWER_THRESHOLD).
    await fld(page, "Category").locator("select").selectOption("Checklist");
    // The seg default (Library=Project) is NOT counted toward the FormScreen's
    // required-field gate until the option is explicitly clicked — the CTA stays
    // no-op (opacity 0.5) otherwise. Click it to arm submit. Create From's
    // default (Current Project Data) is not required, so it needs no click.
    await fld(page, "Library").getByRole("button", { name: "Project" }).click();
    await page.getByRole("button", { name: "Save Template" }).click();

    await expect(page).toHaveURL(/\/m\/templates$/, { timeout: 30_000 });
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 20_000 });
  });

  test("crew: template create is manager-gated (server rejects)", async ({ page }) => {
    await authedSetup(page, "crew");
    await page.goto("/m/templates/new");
    // The page renders the form for anyone who reaches it; the action re-checks.
    await fld(page, "Template Name").locator("input").fill(`E2E Template ${stamp()}`);
    await fld(page, "Category").locator("select").selectOption("Checklist");
    await fld(page, "Library").getByRole("button", { name: "Project" }).click();
    await page.getByRole("button", { name: "Save Template" }).click();
    // Stays on /new with the manager-action error surfaced.
    await expect(page.locator(".ps-alert--danger")).toContainText(/manager action/i, { timeout: 20_000 });
    await expect(page).toHaveURL(/\/m\/templates\/new$/);
  });
});

// DEFERRED — shift scheduler create (`/m/scheduler` New Shift). The New Shift
// FormScreen does not open from a headless `getByRole('button',{name:/new
// shift/i})` click (the form's Area select never mounts), so the CREATE can't be
// driven yet — it needs live-browser archaeology on the FAB/trigger + a seeded
// venue/zone for the Area select. Scheduler render + view-switching (Schedule /
// Coverage / On Now) + the overflow sheet are already covered by
// compvss-kit33-surfaces.spec.ts. Tracked in docs/E2E_COVERAGE_BACKLOG.md.

test.describe("COMPVSS · mobile roster assign (kit 30)", () => {
  test.describe.configure({ timeout: 240_000 });

  test("manager: assigns a person from the mobile roster", async ({ page }) => {
    await authedSetup(page, "manager");
    // Create the person web-side (the crew directory is the assign source).
    const recruit = `E2E Recruit ${stamp()}`;
    await createInModule(page, "/studio/people/crew/new", { name: recruit, role: "Crew" });

    await page.goto("/m/roster/assign");
    const crewSelect = page.locator('select[name="crewMemberId"]');
    await expect(crewSelect).toBeVisible({ timeout: 20_000 });
    const crewValue = await crewSelect.locator("option").filter({ hasText: recruit }).first().getAttribute("value");
    expect(crewValue, `the mobile assign form must list ${recruit}`).toBeTruthy();
    await crewSelect.selectOption(crewValue!);

    // Mobile requires a CATALOG role (no manual-position path) — pick the first
    // real org role option.
    const roleSelect = page.locator('select[name="roleId"]');
    const roleValue = await roleSelect.locator("option:not([disabled])").first().getAttribute("value");
    test.skip(!roleValue, "fixture org seeds no org_roles catalog for the mobile assign roleId select");
    await roleSelect.selectOption(roleValue!);

    // "Send Offer Letter On Save" defaults on → submit reads "Assign & Send Offer".
    await page.getByRole("button", { name: /assign & send offer|^assign$/i }).first().click();
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
    await expect(page).toHaveURL(/\/m\/roster$/, { timeout: 30_000 });
    await expect(page.getByText(recruit).first()).toBeVisible({ timeout: 20_000 });
  });
});
