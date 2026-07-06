/**
 * Booking canon · extras — coverage for the second-pass wiring:
 *   - Settlement detail by id
 *   - Co-pro partnership editor (add + remove)
 *   - Ticketing connection detail + manual sales snapshot
 *   - Insights pool surfaces seeded data
 *   - Stage transitions: applicant + submission
 *   - Detail edits: posting, call, talent, rider
 *   - /me/crew + /me/saved-searches form actions
 *   - /me/submissions/[id] applicant view
 *   - Agency roster entry detail + end-relationship
 */
import { expect, test, type Page } from "playwright/test";
import { dismissConsent, loginAndSwitchWorkspace } from "./helpers/auth";

const TEST_ORG_ID = "f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7";

// Fixtures from marketplace-canon-actions.spec.ts seed.
const FX = {
  talent: "aaaaaaaa-0001-4001-8001-000000000001",
  posting: "bbbbbbbb-0001-4001-8001-000000000001",
  call: "cccccccc-0001-4001-8001-000000000001",
  application: "dddddddd-0001-4001-8001-000000000001",
  submission: "eeeeeeee-0001-4001-8001-000000000001",
  offer: "ffffffff-0001-4001-8001-000000000001",
};

async function loginAsOwner(page: Page) {
  await loginAndSwitchWorkspace(page, "owner", TEST_ORG_ID);
}

test.describe("Booking canon · extras", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAsOwner(page);
  });

  test("posting edit form persists changes", async ({ page }) => {
    const newDescription = `E2E posting note ${Date.now()}`;
    await page.goto(`/studio/marketplace/postings/${FX.posting}/edit`);
    const desc = page.locator('textarea[name="description"]');
    await desc.fill(newDescription);
    await page.getByRole("button", { name: /Save Changes/i }).click();
    await page.waitForURL(`**/studio/marketplace/postings/${FX.posting}`, { timeout: 15_000 });
    await expect(page.getByText(newDescription)).toBeVisible({ timeout: 5_000 });
  });

  test("call edit form persists changes", async ({ page }) => {
    const newDescription = `E2E call note ${Date.now()}`;
    await page.goto(`/studio/marketplace/calls/${FX.call}/edit`);
    await page.locator('textarea[name="description"]').fill(newDescription);
    await page.getByRole("button", { name: /Save Changes/i }).click();
    await page.waitForURL(`**/studio/marketplace/calls/${FX.call}`, { timeout: 15_000 });
    await expect(page.getByText(newDescription)).toBeVisible({ timeout: 5_000 });
  });

  test("talent edit form persists changes", async ({ page }) => {
    const newTagline = `E2E talent tagline ${Date.now()}`;
    await page.goto(`/studio/marketplace/talent/${FX.talent}/edit`);
    await page.getByLabel("Tagline").fill(newTagline);
    await page.getByRole("button", { name: /Save Changes/i }).click();
    await page.waitForURL(`**/studio/marketplace/talent/${FX.talent}`, { timeout: 15_000 });
    await expect(page.getByText(newTagline)).toBeVisible({ timeout: 5_000 });
  });

  test("rider list + new rider form", async ({ page }) => {
    await page.goto(`/studio/marketplace/talent/${FX.talent}/riders`);
    await expect(page.locator("h1")).toContainText("Riders");
    await page
      .getByRole("link", { name: /New Rider/i })
      .first()
      .click();
    await page.waitForURL(/\/riders\/new$/, { timeout: 15_000 });
    await page.locator('select[name="kind"]').selectOption("hospitality");
    await page.getByLabel("Title").fill(`E2E hospitality ${Date.now()}`);
    await page.locator('textarea[name="content"]').fill("Catering: vegan options for 6.");
    await page.getByRole("button", { name: /Save Rider/i }).click();
    await page.waitForURL(/\/riders$/, { timeout: 15_000 });
    await expect(page.getByText(/hospitality/i).first()).toBeVisible();
  });

  test("applicant stage transition", async ({ page }) => {
    await page.goto(`/studio/marketplace/postings/${FX.posting}/applicants/${FX.application}`);
    await expect(page.locator("h1")).toContainText(/#/);
    await page.locator('select[name="status"]').selectOption("reviewed");
    await page.getByLabel(/Score/).fill("82");
    await page.locator('textarea[name="reviewer_notes"]').fill("E2E reviewer note");
    await page.getByRole("button", { name: /Update Stage/i }).click();
    await page.waitForLoadState("load");
    // Reload and assert persistence
    await page.goto(`/studio/marketplace/postings/${FX.posting}/applicants/${FX.application}`);
    await expect(page.getByText("reviewed").first()).toBeVisible();
  });

  test("submission stage transition", async ({ page }) => {
    await page.goto(`/studio/marketplace/calls/${FX.call}/submissions/${FX.submission}`);
    await expect(page.locator("h1")).toContainText(/#/);
    await page.locator('select[name="status"]').selectOption("shortlisted");
    await page.getByLabel(/Score/).fill("90");
    await page.getByRole("button", { name: /Update Status/i }).click();
    await page.waitForLoadState("load");
    await page.goto(`/studio/marketplace/calls/${FX.call}/submissions/${FX.submission}`);
    await expect(page.getByText("shortlisted").first()).toBeVisible();
  });

  test("call submissions list shows seeded submission", async ({ page }) => {
    await page.goto(`/studio/marketplace/calls/${FX.call}/submissions`);
    await expect(page.locator("h1")).toContainText("Submissions");
    await expect(page.getByText("Fixture submission").first()).toBeVisible();
  });

  test("co-pro partner add → remove → cumulative split badge", async ({ page }) => {
    await page.goto(`/studio/bookings/deals/${FX.offer}`);
    // Self-heal: this shared fixture offer accumulates partners if a prior run's
    // remove step was interrupted (prod throttle). Left unchecked they saturate
    // the ≤100% cumulative-split cap and the app then (correctly) rejects new
    // adds. Clear any residue first so the test is idempotent.
    for (let i = 0; i < 8; i++) {
      const removeBtns = page.locator("li").getByRole("button", { name: /Remove/i });
      if ((await removeBtns.count()) === 0) break;
      await removeBtns.first().click();
      await page.waitForLoadState("load");
      await page.goto(`/studio/bookings/deals/${FX.offer}`);
    }
    const partnerName = `E2E CoPro ${Date.now()}`;
    await page.getByLabel("Partner Name").fill(partnerName);
    await page.getByLabel("Split %").fill("25");
    await page.getByRole("button", { name: /Add Partner/i }).click();
    await page.waitForLoadState("load");
    await page.goto(`/studio/bookings/deals/${FX.offer}`);
    await expect(page.getByText(partnerName)).toBeVisible();
    await expect(page.getByText("25% allocated")).toBeVisible();

    // Remove
    const li = page.locator("li", { hasText: partnerName });
    await li.getByRole("button", { name: /Remove/i }).click();
    await page.waitForLoadState("load");
    await page.goto(`/studio/bookings/deals/${FX.offer}`);
    await expect(page.getByText(partnerName)).toHaveCount(0);
  });

  test("ticketing connection detail + record manual snapshot", async ({ page }) => {
    // Create a fresh connection
    await page.goto("/studio/settings/integrations/ticketing/new");
    await page.locator('select[name="provider"]').selectOption("manual");
    const label = `E2E TX ${Date.now()}`;
    await page.getByLabel("Label").fill(label);
    await page.getByRole("button", { name: /^Connect$/i }).click();
    // Action redirects to the new connection's detail page.
    await page.waitForURL(/\/ticketing\/[0-9a-f-]+$/, { timeout: 15_000 });

    await page.getByLabel("Tickets Sold").fill("250");
    await page.getByLabel("Total Capacity").fill("500");
    await page.getByLabel("Gross Revenue").fill("12500");
    await page.getByRole("button", { name: /Record Snapshot/i }).click();
    await page.waitForLoadState("load");
    await expect(page.getByText("Latest Snapshot")).toBeVisible();
    await expect(page.getByText(/250/)).toBeVisible();
  });

  test("insights pool returns seeded aggregates", async ({ page }) => {
    await page.goto("/studio/insights");
    await expect(page.locator("h1")).toContainText("Booking Pool");
    // Test-professional is opted in and we seeded 6 final settlements;
    // talent_profiles.genre_tags includes house+techno, so at least one row.
    await expect(page.getByText(/contributing/i).first()).toBeVisible();
  });

  test("/me/crew upsert", async ({ page }) => {
    await page.goto("/me/crew");
    const tagline = `E2E crew tagline ${Date.now()}`;
    await page.getByLabel("Name").fill(`E2E Crew Self ${Date.now()}`);
    await page.getByLabel("Tagline").fill(tagline);
    await page.getByLabel(/Roles/).fill("A1, Lighting Programmer");
    await page.getByRole("button", { name: /Save Profile/i }).click();
    await page.waitForLoadState("load");
    await page.waitForTimeout(500);
    await page.goto("/me/crew");
    await expect(page.getByLabel("Tagline")).toHaveValue(tagline);
  });

  test("/me/saved-searches add + remove", async ({ page }) => {
    await page.goto("/me/saved-searches");
    const searchName = `E2E Saved ${Date.now()}`;
    await page.locator('select[name="kind"]').selectOption("gig");
    await page.getByLabel("Name").fill(searchName);
    await page.locator('textarea[name="query"]').fill('{"role":"A1"}');
    await page.getByRole("button", { name: /^Save$/i }).click();
    await page.waitForLoadState("load");
    await page.goto("/me/saved-searches");
    await expect(page.getByText(searchName)).toBeVisible();

    const li = page.locator("li", { hasText: searchName });
    await li.getByRole("button", { name: /Remove/i }).click();
    await page.waitForLoadState("load");
    await page.goto("/me/saved-searches");
    await expect(page.getByText(searchName)).toHaveCount(0);
  });

  test("/me/submissions/[id] renders applicant view of seeded submission", async ({ page }) => {
    const r = await page.goto(`/me/submissions/${FX.submission}`);
    expect(r?.status()).toBe(200);
    await expect(page.locator("h1").first()).toContainText("#");
  });
});
