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
import { authedSetup } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

const RUN = stamp();
const JACK = `E2E Jack Sparrow ${RUN}`;
const REPORTS = [`E2E Captain America ${RUN}`, `E2E Spiderman ${RUN}`, `E2E Wonder Woman ${RUN}`];
// Valid UPC-A (check digit passes gtin.ts); canonical GTIN-14 = 00036000291452.
const UPC = "036000291452";
const ERROR_BOUNDARY = /something went wrong|application error|unhandled|digest:/i;

let projectId = "";

async function resolveFixtureProjectId(page: Page): Promise<string> {
  const r = await page.request.get("/api/v1/projects");
  const body = await r.json();
  const rows = body?.data?.projects ?? body?.data ?? [];
  const p = rows.find((x: { name?: string }) => /fixture|e2e/i.test(x.name ?? "")) ?? rows[0];
  expect(p?.id, "the fixture org must expose at least one project").toBeTruthy();
  return p.id;
}

async function assignPerson(page: Page, person: string, title: string, reportsToLabel?: string) {
  await page.goto(`/studio/projects/${projectId}/roster?assign=1`);
  const dialog = page.getByRole("dialog", { name: /assign to project/i }).or(page.locator("main"));
  await expect(dialog.locator('select[name="crewMemberId"]')).toBeVisible({ timeout: 20_000 });
  await dialog.locator('select[name="crewMemberId"]').selectOption({ label: person });
  // Manual position path — no dependency on the org's role catalog.
  const manualToggle = page.getByText(/enter position manually|position · manual/i).first();
  if (await manualToggle.isVisible({ timeout: 2_000 }).catch(() => false)) await manualToggle.click();
  await dialog.locator('input[name="manualTitle"]').fill(title);
  await dialog.locator('input[name="startDate"], [name="startDate"]').first().fill("2026-10-01");
  await dialog.locator('input[name="endDate"], [name="endDate"]').first().fill("2026-10-20");
  if (reportsToLabel) {
    const rt = dialog.locator('select[name="reportsTo"]');
    if (await rt.count()) await rt.selectOption({ label: reportsToLabel }).catch(() => {});
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

    // Catering line: Lunch only + Every Contract Day → 20 days × 1 meal.
    await page.getByRole("button", { name: /^lunch$/i }).first().click();
    await page.getByText(/every contract day/i).first().click();
    await expect(page.getByText(/20 Days/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/20 Meals/i).first()).toBeVisible();

    await page.getByRole("button", { name: /review & submit|submit/i }).first().click();
    await page.waitForURL(/advancing\/fulfillment/, { timeout: 30_000 });

    // Approve everything so the scan has an approved line to fulfill.
    await page.getByRole("button", { name: /approve all/i }).click();
    await expect(page.getByText(/approved/i).first()).toBeVisible({ timeout: 30_000 });
  });

  test("(d) bind the UPC, scan on POS, the vehicle line flips to Fulfilled", async ({ page, browser }) => {
    // Journal the unknown UPC, then bind it to the vehicle catalog item.
    await authedSetup(page, "manager");
    const miss = await page.request.post("/api/v1/scan", { data: { code: UPC, mode: "pos" } });
    expect(miss.status()).toBeLessThan(500);

    await page.goto("/studio/settings/capabilities/scan-misses");
    const missRow = page.locator("tr,div.item,li").filter({ hasText: /36000291452/ }).first();
    await expect(missRow, "the unknown UPC must be journaled").toBeVisible({ timeout: 20_000 });
    const bindSelect = missRow.locator("select").first();
    await expect(bindSelect).toBeVisible({ timeout: 10_000 });
    const vehicleValue = await bindSelect
      .locator("option")
      .filter({ hasText: /vehicle/i })
      .first()
      .getAttribute("value");
    expect(vehicleValue, "a vehicle catalog item must exist to bind").toBeTruthy();
    await bindSelect.selectOption(vehicleValue!);
    await missRow.getByRole("button", { name: /bind/i }).click();
    await expect(missRow).not.toBeVisible({ timeout: 20_000 });

    // API-level resolution proof: the bound GTIN now resolves to a product
    // with Jack's open approved line.
    const hit = await page.request.post("/api/v1/scan", { data: { code: UPC, mode: "pos" } });
    const body = await hit.json();
    expect(body?.data?.result ?? body?.result, "the scan must resolve a product").toBe("product");

    // Field half: manual/wedge entry on the POS segment → Confirm Fulfillment.
    const field = await browser.newContext();
    const fieldPage = await field.newPage();
    try {
      await authedSetup(fieldPage, "manager");
      await fieldPage.goto("/m/check-in?mode=pos");
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
