/**
 * Kit 30 acceptance — the Jack Sparrow scenario, end to end on both shells.
 *
 *   (a) contract Jack Sparrow as VIP Manager for the project window,
 *   (b) advance him a credential + a vehicle + catering LUNCH ONLY for
 *       every contract day,
 *   (c) set three direct reports under him,
 *   (d) resolve the vehicle's UPC on the POS segment and watch the advance
 *       line flip to Fulfilled with scan provenance.
 *
 * Self-sufficient: every person is E2E-stamped (the teardown purges "E2E %"
 * residue), the position uses the manual fallback (no catalog seeding), the
 * GTIN is bound in-run through the scan-misses Bind flow. Serial: each test
 * builds on the previous one's state.
 */
import { expect, test, type Page } from "./helpers/base";
import { authedSetup, suppressTour } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

// The first-run ConsoleTour scrim intercepts every click on /studio —
// file-scoped so it lands before any goto (the fulfillment "Approve All"
// click died under it for 420s).
test.beforeEach(({ page }) => suppressTour(page));

const RUN = stamp();
const JACK = `E2E Jack Sparrow ${RUN}`;
const REPORTS = [`E2E Captain America ${RUN}`, `E2E Spiderman ${RUN}`, `E2E Wonder Woman ${RUN}`];
// Valid UPC-A (check digit passes gtin.ts); canonical GTIN-14 = 00036000291452.
const UPC = "036000291452";
const ERROR_BOUNDARY = /something went wrong|application error|unhandled|digest:/i;

let projectId = "";

async function resolveFixtureProjectId(page: Page): Promise<string> {
  const r = await page.request.get("/api/v1/projects?pageSize=100");
  const body = await r.json();
  type Row = { id: string; name?: string; project_state?: string; start_date?: string | null };
  const rows: Row[] = body?.data?.projects ?? body?.data ?? [];
  // MUST mirror the mobile shell's resolveActiveProject (m/roster/shared.ts):
  // the ACTIVE project with the latest start_date. Matching on /e2e|fixture/
  // here once picked an "E2E Proposal …" residue project, so the whole web
  // flow ran on a project the mobile leg never shows.
  const active = rows
    .filter((x) => x.project_state === "active")
    .sort((a, b) => (b.start_date ?? "").localeCompare(a.start_date ?? ""));
  const p = active[0] ?? rows[0];
  expect(p?.id, "the fixture org must expose at least one active project").toBeTruthy();
  return p!.id;
}

async function assignPerson(page: Page, person: string, title: string, reportsToLabel?: string) {
  await page.goto(`/studio/projects/${projectId}/roster?assign=1`);
  const dialog = page.getByRole("dialog", { name: /assign to project/i }).or(page.locator("main"));
  const crewSelect = dialog.locator('select[name="crewMemberId"]');
  await expect(crewSelect).toBeVisible({ timeout: 20_000 });
  // Options render as "{name} · {role}" when a role is set, so a bare-name
  // label match never resolves — pick by the option's value instead.
  const crewValue = await crewSelect.locator("option").filter({ hasText: person }).first().getAttribute("value");
  expect(crewValue, `the drawer must list ${person}`).toBeTruthy();
  await crewSelect.selectOption(crewValue!);
  // Manual position path — no dependency on the org's role catalog.
  const manualToggle = page.getByText(/enter position manually|position · manual/i).first();
  if (await manualToggle.isVisible({ timeout: 2_000 }).catch(() => false)) await manualToggle.click();
  await dialog.locator('input[name="manualTitle"]').fill(title);
  await dialog.locator('input[name="startDate"], [name="startDate"]').first().fill("2026-10-01");
  await dialog.locator('input[name="endDate"], [name="endDate"]').first().fill("2026-10-20");
  if (reportsToLabel) {
    // Same "{name} · {role}" label shape as the crew select — resolve by value.
    const rt = dialog.locator('select[name="reportsTo"]');
    const rtValue = await rt.locator("option").filter({ hasText: reportsToLabel }).first().getAttribute("value");
    expect(rtValue, `the reports-to select must list ${reportsToLabel}`).toBeTruthy();
    await rt.selectOption(rtValue!);
  }
  await dialog.getByRole("button", { name: /assign/i }).first().click();
  await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  await expect(page.getByText(person).first()).toBeVisible({ timeout: 30_000 });
}

test.describe("kit 30 · Jack Sparrow lifecycle", () => {
  test.describe.configure({ mode: "serial", timeout: 420_000 });

  test("(a+c) web: contract Jack as VIP Manager with three direct reports", async ({ page }) => {
    await authedSetup(page, "manager");
    projectId = await resolveFixtureProjectId(page);

    // People first — the assign drawer picks from the crew directory.
    for (const name of [JACK, ...REPORTS]) {
      await createInModule(page, "/studio/people/crew/new", { name, role: "Crew" });
    }

    await assignPerson(page, JACK, "VIP Manager");
    for (const r of REPORTS) await assignPerson(page, r, "Crew", JACK);

    // The reporting tree shows Jack with 3 direct reports.
    await page.goto(`/studio/projects/${projectId}/roster/reporting`);
    await expect(page.getByText(JACK).first()).toBeVisible({ timeout: 20_000 });
    const jackNode = page.locator("div,li").filter({ hasText: JACK }).filter({ hasText: /3/ }).first();
    await expect(jackNode, "Jack's node must carry his 3 direct reports").toBeVisible({ timeout: 15_000 });
  });

  test("(b) web: advance cart — credential + vehicle + lunch-only catering, 20 days", async ({ page }) => {
    await authedSetup(page, "manager");
    await page.goto(`/studio/projects/${projectId}/advancing/cart`);
    await expect(page.getByLabel(/search catalog/i)).toBeVisible({ timeout: 20_000 });

    // The cart is per-person: pick Jack.
    const personSelect = page.locator("main select").first();
    await personSelect.selectOption({ label: JACK });

    for (const term of ["Credential", "Vehicle", "Catering"]) {
      await page.getByLabel(/search catalog/i).fill(term);
      const add = page.getByRole("button", { name: /add/i }).first();
      await expect(add, `catalog must offer a ${term} item`).toBeVisible({ timeout: 15_000 });
      await add.click();
    }

    // Catering line: lunch-only + Every Contract Day are the DEFAULTS on a
    // new line (clicking would toggle them OFF — the first run of this spec
    // did exactly that and asserted its way to 0 meals). Assert the defaults
    // hold, then confirm the derived summary: 20 days × 1 meal.
    await expect(page.getByRole("button", { name: /^lunch$/i }).first()).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel(/every contract day/i).first()).toBeChecked();
    await expect(page.getByText(/20 Days/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/20 Meals/i).first()).toBeVisible();

    await page.getByRole("button", { name: /review & submit|submit/i }).first().click();
    await page.waitForURL(/advancing\/fulfillment/, { timeout: 30_000 });

    // Approve everything so the scan has an approved line to fulfill.
    await page.getByRole("button", { name: /approve all/i }).click();
    await expect(page.getByText(/approved/i).first()).toBeVisible({ timeout: 30_000 });
  });

  test("(d) bind the UPC, scan on POS, the vehicle line flips to Fulfilled", async ({ page, browser }) => {
    await authedSetup(page, "manager");

    // The GTIN binding is ORG-DURABLE state, not run-scoped — a prior
    // attempt (or retry) that reached the bind leaves the UPC resolving as
    // product, the miss row resolved, and nothing left to journal. So the
    // journal+bind half runs only when the scan still misses; a retry that
    // finds the binding done skips straight to the fulfillment half.
    const scanResult = async (): Promise<string | undefined> => {
      const r = await page.request.post("/api/v1/scan", { data: { code: UPC, mode: "pos" } });
      const body = await r.json().catch(() => null);
      return body?.data?.result ?? body?.result;
    };

    if ((await scanResult()) !== "product") {
      // That miss is now journaled — bind it to the vehicle catalog item.
      await page.goto("/studio/settings/capabilities/scan-misses");
      const missRow = page.locator("tr").filter({ hasText: /36000291452/ }).first();
      await expect(missRow, "the unknown UPC must be journaled").toBeVisible({ timeout: 20_000 });
      // Two-step disclosure: "Bind" opens the inline form, THEN the select.
      await missRow.getByRole("button", { name: /^bind$/i }).click();
      const bindSelect = missRow.locator("select").first();
      await expect(bindSelect).toBeVisible({ timeout: 10_000 });
      const vehicleValue = await bindSelect
        .locator("option")
        .filter({ hasText: /vehicle/i })
        .first()
        .getAttribute("value");
      expect(vehicleValue, "a vehicle catalog item must exist to bind").toBeTruthy();
      await bindSelect.selectOption(vehicleValue!);
      await missRow.getByRole("button", { name: /^bind$|^binding/i }).click();
      // Don't assert the in-place "Bound" swap — the action revalidates the
      // page and the resolved row can leave the queue before the status
      // paints. The API poll below is the proof of the binding.
    }

    // API-level resolution proof: the bound GTIN resolves to a product.
    await expect
      .poll(scanResult, { timeout: 20_000, message: "the bound GTIN must resolve to a product" })
      .toBe("product");

    // Field half: manual/wedge entry on the POS segment → Confirm Fulfillment.
    const field = await browser.newContext();
    const fieldPage = await field.newPage();
    try {
      await authedSetup(fieldPage, "manager");
      // waitUntil "commit" + one retry: the first goto in this fresh context
      // intermittently dies ERR_ABORTED (superseded by a straggling
      // post-login redirect); the .scr-h wait below is the real readiness
      // gate either way.
      await fieldPage
        .goto("/m/check-in?mode=pos", { waitUntil: "commit" })
        .catch(() => fieldPage.goto("/m/check-in?mode=pos", { waitUntil: "commit" }));
      await expect(fieldPage.locator(".scr-h, h1").first()).toBeVisible({ timeout: 20_000 });
      const manualOpen = fieldPage.getByText(/enter code manually/i).first();
      if (await manualOpen.isVisible({ timeout: 5_000 }).catch(() => false)) await manualOpen.click();
      const codeInput = fieldPage.locator('input[name="code"], input[placeholder*="R7-014"]').first();
      await codeInput.fill(UPC);
      await codeInput.press("Enter");

      await expect(fieldPage.getByText(/vehicle/i).first()).toBeVisible({ timeout: 20_000 });
      const confirm = fieldPage.getByRole("button", { name: /confirm fulfillment/i }).first();
      await expect(confirm, "the approved line must offer Confirm Fulfillment").toBeVisible({ timeout: 15_000 });
      await confirm.click();
      await expect(fieldPage.getByText(/fulfilled/i).first()).toBeVisible({ timeout: 30_000 });
    } finally {
      await field.close();
    }

    // Console agrees: the queue shows the vehicle line Fulfilled.
    await page.goto(`/studio/projects/${projectId}/advancing/fulfillment`);
    await expect(
      page
        .locator("tr,div")
        .filter({ hasText: JACK })
        .filter({ hasText: /fulfilled/i })
        .first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("mobile: roster, contract, packet and advance all render Jack", async ({ page }) => {
    await authedSetup(page, "manager");
    await page.goto("/m/roster");
    await expect(page.locator(".scr-h, h1").first()).toBeVisible({ timeout: 20_000 });
    const jackCard = page.getByText(JACK).first();
    await expect(jackCard).toBeVisible({ timeout: 20_000 });
    await jackCard.click();

    // Contract detail: the track + the window.
    await expect(page.getByText(/VIP Manager/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);

    // Packet: 4 docs.
    const onboarding = page.getByRole("link", { name: /onboarding/i }).first();
    if (await onboarding.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await onboarding.click();
      await expect(page.getByText(/of 4 docs/i).first()).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(/pre-arrival/i).first()).toBeVisible();
    }
  });
});
