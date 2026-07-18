/**
 * Kit 30 · roster engagement lifecycle — behavioral coverage the acceptance
 * spec (lifecycle-jack-sparrow) does NOT drive.
 *
 * jack-sparrow contracts crew (assign + send offer) and views the reporting
 * tree, but it never (1) accepts the offer letter through the public token
 * surface (the sent → accepted `letter_state` FSM) nor (2) uses the dedicated
 * Edit Reports drawer to re-point a reporting edge. Those two mutating flows
 * were flagged UNCOVERED by the 2026-07-18 coverage-gap sweep. This closes them.
 *
 * Prod-safe: the only push in this area is accept/decline → the letter's
 * `created_by` (our own test manager fixture). Fixture hygiene: every person is
 * `E2E Recruit <ts>` / `E2E Skipper <ts>` — the letters-first purgeLifecycleCast
 * block in scripts/e2e-clean-fixtures.mjs is extended to cover both patterns.
 */
import { expect, test, type Page } from "./helpers/base";
import { authedSetup, suppressTour, dismissConsent } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
const ERROR_BOUNDARY = /something went wrong|application error|unhandled|digest:/i;

// The ConsoleTour scrim intercepts /studio clicks — file-scoped so the
// addInitScript lands before the first in-test login goto.
test.beforeEach(({ page }) => suppressTour(page));

async function resolveFixtureProjectId(page: Page): Promise<string> {
  const r = await page.request.get("/api/v1/projects?pageSize=100");
  const body = await r.json();
  type Row = { id: string; project_state?: string; start_date?: string | null };
  const rows: Row[] = body?.data?.projects ?? body?.data ?? [];
  const active = rows
    .filter((x) => x.project_state === "active")
    .sort((a, b) => (b.start_date ?? "").localeCompare(a.start_date ?? ""));
  const p = active[0] ?? rows[0];
  expect(p?.id, "the fixture org must expose at least one active project").toBeTruthy();
  return p!.id;
}

// Assign a crew person onto the project WITH the offer letter sent (the
// drawer's "Send Offer Letter On Save" toggle defaults on, so the submit reads
// "Assign & Send Offer" and the letter lands in `sent`). Mirrors the proven
// jack-sparrow drawer helper: options render "{name} · {role}", so the crew is
// resolved by option value, and the manual-position path avoids catalog seeding.
async function assignWithOffer(page: Page, projectId: string, person: string, title: string, reportsTo?: string) {
  await page.goto(`/studio/projects/${projectId}/roster?assign=1`);
  const dialog = page.getByRole("dialog", { name: /assign to project/i }).or(page.locator("main"));
  const crewSelect = dialog.locator('select[name="crewMemberId"]');
  await expect(crewSelect).toBeVisible({ timeout: 20_000 });
  const crewValue = await crewSelect.locator("option").filter({ hasText: person }).first().getAttribute("value");
  expect(crewValue, `the drawer must list ${person}`).toBeTruthy();
  await crewSelect.selectOption(crewValue!);
  const manualToggle = page.getByText(/enter position manually|position · manual/i).first();
  if (await manualToggle.isVisible({ timeout: 2_000 }).catch(() => false)) await manualToggle.click();
  await dialog.locator('input[name="manualTitle"]').fill(title);
  await dialog.locator('input[name="startDate"], [name="startDate"]').first().fill("2026-10-01");
  await dialog.locator('input[name="endDate"], [name="endDate"]').first().fill("2026-10-20");
  if (reportsTo) {
    const rt = dialog.locator('select[name="reportsTo"]');
    const rtValue = await rt.locator("option").filter({ hasText: reportsTo }).first().getAttribute("value");
    expect(rtValue, `the reports-to select must list ${reportsTo}`).toBeTruthy();
    await rt.selectOption(rtValue!);
  }
  await dialog.getByRole("button", { name: /assign/i }).first().click();
  await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  await expect(page.getByText(person).first()).toBeVisible({ timeout: 30_000 });
}

test.describe("kit 30 · roster engagement lifecycle", () => {
  test.describe.configure({ timeout: 300_000 });

  // HIGH — the offer-letter accept FSM. A sent letter reached through the public
  // /offer/<token> surface accepts (signature ≥ 2 chars), driving the
  // sent → accepted transition (RPC accept_offer_letter, replay-guarded) and
  // rendering the signed notice. jack-sparrow only assigns; this signs.
  test("manager: a sent offer letter accepts through the public token surface", async ({ page, browser }) => {
    await authedSetup(page, "manager");
    const projectId = await resolveFixtureProjectId(page);

    const recruit = `E2E Recruit ${stamp()}`;
    await createInModule(page, "/studio/people/crew/new", { name: recruit, role: "Crew" });
    await assignWithOffer(page, projectId, recruit, "Stagehand");

    // Find the freshly-created letter and scrape its public token + access code
    // off the detail's LetterShareCard (no service client needed).
    await page.goto("/studio/people/offer-letters");
    await page.getByText(recruit).first().click();
    await expect(page).toHaveURL(new RegExp(`/studio/people/offer-letters/${UUID.source}`), { timeout: 30_000 });
    const shareUrl = (await page.locator(".font-mono.break-all").first().innerText()).trim();
    const token = shareUrl.match(/\/offer\/([^/\s?#]+)/)?.[1];
    expect(token, "the share card must expose the public /offer/<token> URL").toBeTruthy();
    const accessCode = (await page.locator(".font-mono.text-2xl").first().innerText()).trim();
    expect(accessCode, "the share card must expose the 6-char access code").toMatch(/^[A-Z0-9]{6}$/);

    // Accept as the anonymous recipient in a clean context (no operator cookies).
    const ctx = await browser.newContext();
    const offer = await ctx.newPage();
    try {
      await offer.goto(`/offer/${token}`);
      await dismissConsent(offer);
      await offer.locator('input[name="access_code"]').fill(accessCode);
      await offer.getByRole("button", { name: /open letter/i }).click();
      await offer.getByRole("button", { name: /accept and sign/i }).click();
      // Signature is prefilled with the recipient name; sign.
      await expect(offer.locator('input[name="signature"]')).toBeVisible({ timeout: 15_000 });
      await offer.getByRole("button", { name: /sign and accept/i }).click();
      // sent → accepted: the RSC re-renders to the signed notice.
      await expect(offer.getByText(/you signed this letter/i)).toBeVisible({ timeout: 30_000 });
    } finally {
      await ctx.close();
    }
  });

  // MEDIUM — the Edit Reports drawer. Two contracted crew, then the drawer
  // re-points one under the other (setReportsAction → offer_letters
  // .reports_to_crew_member_id on live letters). jack-sparrow sets reports at
  // assign time; this drives the dedicated post-hoc edit surface.
  test("manager: the Edit Reports drawer re-points a reporting edge", async ({ page }) => {
    await authedSetup(page, "manager");
    const projectId = await resolveFixtureProjectId(page);

    const skipper = `E2E Skipper ${stamp()}`;
    const mate = `E2E Recruit ${stamp()}`;
    await createInModule(page, "/studio/people/crew/new", { name: skipper, role: "Crew" });
    await createInModule(page, "/studio/people/crew/new", { name: mate, role: "Crew" });
    await assignWithOffer(page, projectId, skipper, "Deck Boss");
    await assignWithOffer(page, projectId, mate, "Deck Hand");

    // Open the Edit Reports drawer (edit=1 mounts it when nodes exist).
    await page.goto(`/studio/projects/${projectId}/roster/reporting?edit=1`);
    const dialog = page.getByRole("dialog", { name: /edit reports/i }).or(page.locator("main"));
    const managerSelect = dialog.locator('select[name="managerId"]');
    await expect(managerSelect).toBeVisible({ timeout: 20_000 });
    const mgrValue = await managerSelect.locator("option").filter({ hasText: skipper }).first().getAttribute("value");
    expect(mgrValue, `the manager select must list ${skipper}`).toBeTruthy();
    await managerSelect.selectOption(mgrValue!);
    // Direct reports render as LabeledCheckbox with the person's name as label.
    await dialog.getByText(mate).first().click();
    await dialog.getByRole("button", { name: /update reports/i }).click();
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);

    // Back on the reporting tree, the skipper node now carries a direct report.
    await page.goto(`/studio/projects/${projectId}/roster/reporting`);
    await expect(page.getByText(skipper).first()).toBeVisible({ timeout: 20_000 });
    const bossNode = page.locator("div,li").filter({ hasText: skipper }).filter({ hasText: /1|report/i }).first();
    await expect(bossNode, "the skipper node must show its direct report").toBeVisible({ timeout: 15_000 });
  });
});
