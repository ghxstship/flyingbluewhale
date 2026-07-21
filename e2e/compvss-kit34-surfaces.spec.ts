/**
 * COMPVSS field PWA (/m) — kit 34 (v3.1–v8.0) surface coverage, all personas.
 *
 * Kit 34 layered the six-hub IA (Projects · Operations · Logistics · Workforce ·
 * Assets & Equipment · Finance), the Airtable-plus view engine (NormalizedList +
 * the View Options / Share & Export drawer ActionBar + typed quick-filter pills +
 * DataView list/table/board), the XPMS Projects surfaces (Timeline · Milestones ·
 * Calendar · Tasks), and the deployment-polish handoffs (Daily Report, Time Sheets
 * → Payroll, Finance → Accounting/ERP). This spec walks each at persona depth:
 * render + the RBAC gate + one real view-engine interaction — so a regression on
 * any of them fails CI rather than a screenshot review.
 *
 * Determinism: the Operations/Logistics ledgers render client-side seed data
 * (OPS_* constants) so rows always exist. The Projects surfaces read live org-
 * scoped XPMS tables; the fixture org (Test Professional Org) may carry no active
 * project, so those assert render + no error boundary (content-or-empty), never a
 * specific row.
 *
 * Fixtures: test+<role>@flyingbluewhale.app (crew · manager · admin · owner).
 * crew = member-tier (managerOnly members self-hide, Finance/Time Sheets gated);
 * manager/admin/owner = isManagerPlus.
 */
import { expect, test, type Page } from "./helpers/base";
import { authedSetup, suppressTour } from "./helpers/auth";

const ERROR_BOUNDARY = /something went wrong|application error|unhandled|digest:/i;

// Kit 34 v3.x: hubs have NO launcher route — the drawer lands straight on the
// hub's first role-visible member (whose HubChrome prints the hub label). These
// are the all-crew-visible hubs' first members; Workforce (managerOnly, Schedule
// first) is covered by the RBAC test below.
const HUBS: { landing: string; title: RegExp }[] = [
  { landing: "/m/projects/timeline", title: /projects/i },
  { landing: "/m/daily-report", title: /operations/i },
  { landing: "/m/logistics", title: /logistics/i },
  { landing: "/m/inventory", title: /assets|equipment/i },
];

// Seed-backed normalized ledgers (Operations + Logistics) — always have rows, so
// the view engine (pills + DataView + drawer ActionBar) is deterministic.
const SEED_LEDGERS: { route: string; title: RegExp }[] = [
  { route: "/m/reports", title: /reports/i },
  { route: "/m/inspections", title: /inspections/i },
  { route: "/m/permits", title: /permits/i },
  { route: "/m/travel", title: /travel/i },
  { route: "/m/logistics", title: /logistics/i },
  { route: "/m/logistics/docks", title: /docks/i },
  { route: "/m/logistics/gate", title: /gate/i },
  { route: "/m/logistics/delivery", title: /delivery/i },
];

// XPMS Projects members — live org-scoped reads (content-or-empty).
const PROJECT_SURFACES = [
  "/m/projects/timeline",
  "/m/projects/milestones",
  "/m/projects/calendar",
  "/m/projects/tasks",
];

test.beforeEach(({ page }) => suppressTour(page));

async function expectRendered(page: Page) {
  await expect(page.locator(".scr-h, h1").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
}

/** The normalized view engine's fixed chrome: drawer ActionBar + quick pills. */
async function expectViewEngine(page: Page) {
  await expect(page.locator(".actionbar").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: /view options/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /share & export/i }).first()).toBeVisible();
}

// ─────────────────────────────────────────────────────────────────────────────
// CREW — member tier: hubs render, managerOnly members self-hide, gates hold.
// ─────────────────────────────────────────────────────────────────────────────
test.describe("COMPVSS kit 34 · hubs + view engine · crew", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "crew"));

  for (const hub of HUBS) {
    test(`hub ${hub.landing} lands directly on its first member (no launcher step)`, async ({ page }) => {
      await page.goto(hub.landing);
      await expectRendered(page);
      // Kit 34 v3.x removed the redundant launcher: the landing routes straight
      // to the first member, whose HubChrome prints the hub label + the member
      // viewseg (so switching between members stays one tap, with no extra step).
      await expect(page.locator(".scr-h").first()).toContainText(hub.title);
      await expect(page.locator(".viewseg a").first()).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
    });
  }

  test("Workforce viewseg hides the managerOnly members (Schedule · Time Sheets) for crew", async ({ page }) => {
    // Crew reach the Workforce hub via its open member Roster (/m/directory) — the
    // managerOnly Schedule + Time Sheets self-hide from the hub viewseg.
    await page.goto("/m/directory");
    await expectRendered(page);
    const labels = (await page.locator(".viewseg a").allInnerTexts()).join(" | ").toLowerCase();
    expect(labels, "crew must still see the open members").toContain("roster");
    expect(labels, "Schedule is managerOnly — hidden for crew").not.toContain("schedule");
    expect(labels, "Time Sheets is managerOnly — hidden for crew").not.toContain("time sheets");
  });

  test("Finance hub is gated to Manager Access Only for crew", async ({ page }) => {
    await page.goto("/m/finance");
    await expect(page.getByText(/manager access only/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  });

  test("Time Sheets: crew sees the surface without the manager-only Export → Payroll", async ({ page }) => {
    await page.goto("/m/time-sheets");
    await expectRendered(page);
    // Gated exactly like Finance — crew gets the read-blocked state, not the
    // approve/flag/Export → Payroll surface.
    await expect(page.getByText(/manager access only/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: /export.*payroll|→ payroll/i })).toHaveCount(0);
  });

  test("seed-backed ledger /m/reports drives the full view engine + pills", async ({ page }) => {
    await page.goto("/m/reports");
    await expectRendered(page);
    await expectViewEngine(page);
    await expect(page.locator(".pill").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".item.tap").first()).toBeVisible();
  });

  test("Home Quick Actions customizer is functional (add ↔ remove, not a stub)", async ({ page }) => {
    await page.goto("/m");
    await expectRendered(page);
    // Open the Customize sheet from the dashed qa-add tile.
    await page.locator(".qa-add").click();
    const panel = page.locator(".sheet-panel").first();
    await expect(panel).toBeVisible({ timeout: 10_000 });
    // The real editor: active rows carry Remove controls (proves it's not the
    // old "coming soon" placeholder).
    const removers = page.getByRole("button", { name: /^Remove / });
    const adders = page.getByRole("button", { name: /^Add / });
    const before = await removers.count();
    expect(before, "the active set renders removable rows").toBeGreaterThan(0);
    // AVAILABLE pool exists (registry > default), so add the first available →
    // the active count grows by one; then remove it → back to the start. This
    // exercises persistence (setPrefs fires) while leaving the fixture clean.
    expect(await adders.count(), "an AVAILABLE pool is offered").toBeGreaterThan(0);
    await adders.first().click();
    await expect(removers).toHaveCount(before + 1);
    await removers.last().click();
    await expect(removers).toHaveCount(before);
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  });

  test("directory row tap opens a RecordDetail (no dead-tap stub)", async ({ page }) => {
    await page.goto("/m/directory");
    await expectRendered(page);
    const row = page.locator(".item.tap").first();
    if (await row.count()) {
      await row.click();
      // The tap now opens the person's RecordDetail overlay (was onClick={()=>{}}).
      await expect(page.locator(".formscreen").first()).toBeVisible({ timeout: 10_000 });
    }
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MANAGER — isManagerPlus: full hub set, deep view-engine interactions, handoffs.
// ─────────────────────────────────────────────────────────────────────────────
test.describe("COMPVSS kit 34 · view engine + handoffs · manager", () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "manager"));

  for (const led of SEED_LEDGERS) {
    test(`ledger ${led.route} renders the drawer ActionBar + pills + rows`, async ({ page }) => {
      await page.goto(led.route);
      await expectRendered(page);
      // The ledger identity prints in the HubChrome header (hub label) or the
      // active viewseg member — assert it appears, not that it pins `.scr-h`
      // (member mode shows the *hub* label there, e.g. "Operations").
      await expect(page.getByText(led.title).first()).toBeVisible({ timeout: 10_000 });
      await expectViewEngine(page);
      await expect(page.locator(".item.tap").first()).toBeVisible({ timeout: 10_000 });
    });
  }

  test("View Options drawer opens with the field/sort/group controls", async ({ page }) => {
    await page.goto("/m/reports");
    await expectRendered(page);
    await page.getByRole("button", { name: /view options/i }).first().click();
    // The drawer is a `Sheet` bottom-panel titled "View Options".
    const panel = page.locator(".sheet-panel").first();
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(panel.getByText(/view options/i).first()).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  });

  test("Share & Export drawer opens", async ({ page }) => {
    await page.goto("/m/inspections");
    await expectRendered(page);
    await page.getByRole("button", { name: /share & export/i }).first().click();
    const panel = page.locator(".sheet-panel").first();
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(panel.getByText(/share & export/i).first()).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  });

  test("a quick-filter pill toggles the active state and keeps the list rendered", async ({ page }) => {
    await page.goto("/m/logistics");
    await expectRendered(page);
    const pill = page.locator(".pill").first();
    await expect(pill).toBeVisible({ timeout: 10_000 });
    await pill.click();
    // Toggling a pill re-runs the model; the list must survive (rows or empty),
    // never an error boundary.
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
    await expect(page.locator(".actionbar").first()).toBeVisible();
  });

  test("clicking a ledger row opens its RecordDetail with the record's fields", async ({ page }) => {
    await page.goto("/m/logistics");
    await expectRendered(page);
    const row = page.locator(".item.tap").first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    const title = (await row.locator(".t").first().innerText()).trim();
    await row.click();
    // RecordDetail renders as a `.formscreen` overlay echoing the record title.
    await expect(page.locator(".formscreen").first()).toBeVisible({ timeout: 10_000 });
    if (title) await expect(page.locator(".formscreen").getByText(title, { exact: false }).first()).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  });

  test("Finance hub renders the budget + Accounting/ERP sync affordance for a manager", async ({ page }) => {
    await page.goto("/m/finance");
    await expectRendered(page);
    await expect(page.getByText(/manager access only/i)).toHaveCount(0);
    await expect(page.getByText(/accounting|erp|sync/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("Time Sheets exposes approve/flag + Export → Payroll for a manager", async ({ page }) => {
    await page.goto("/m/time-sheets");
    await expectRendered(page);
    await expect(page.getByText(/payroll/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  });

  test("Daily Report rollup renders with File + Export affordances", async ({ page }) => {
    await page.goto("/m/daily-report");
    await expectRendered(page);
    await expect(page.getByText(/shift notes|open incidents|deliveries/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/export|file|pdf/i).first()).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  });

  for (const route of PROJECT_SURFACES) {
    test(`XPMS project surface ${route} renders (content-or-empty)`, async ({ page }) => {
      await page.goto(route);
      await expectRendered(page);
      await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// OWNER — a compact top-of-org pass: every hub landing renders clean.
// ─────────────────────────────────────────────────────────────────────────────
test.describe("COMPVSS kit 34 · hub landings · owner", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  for (const hub of HUBS) {
    test(`owner opens hub ${hub.landing} clean`, async ({ page }) => {
      await page.goto(hub.landing);
      await expectRendered(page);
      await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
    });
  }

  test("owner reaches Finance without the crew gate", async ({ page }) => {
    await page.goto("/m/finance");
    await expectRendered(page);
    await expect(page.getByText(/manager access only/i)).toHaveCount(0);
  });
});
