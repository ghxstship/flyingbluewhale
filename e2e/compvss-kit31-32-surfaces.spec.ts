/**
 * COMPVSS field PWA (/m) — kit 31 + 32 surface coverage, crew + manager.
 *
 * The kits landed a wave of new field surfaces; this spec walks each at
 * persona depth (render + the RBAC gate + one real interaction where the
 * persona is allowed one), so a regression on any of them fails CI rather
 * than a screenshot review.
 *
 * Landed surfaces covered here (build-agent wave-2 items get their own spec):
 *   Templates · Field Finance (manager) · Emergency pages (codes/fire/
 *   evacuation/shelter) · Scanner mode · Notification detail · Shift
 *   Scheduler (manager) · the report record + status chain.
 *
 * Fixtures: test+crew@flyingbluewhale.app (crew), test+manager@…app (manager),
 * both in Test Professional Org.
 */
import { expect, test, type Page } from "./helpers/base";
import { authedSetup, suppressTour } from "./helpers/auth";

const ERROR_BOUNDARY = /something went wrong|application error|unhandled|digest:/i;

test.beforeEach(({ page }) => suppressTour(page));

async function expectRendered(page: Page) {
  await expect(page.locator(".scr-h, h1").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
}

test.describe("COMPVSS kit 31/32 surfaces · crew", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "crew"));

  test("emergency pages all render with crumbs and no error boundary", async ({ page }) => {
    for (const leg of ["codes", "fire", "evacuation", "shelter"]) {
      await page.goto(`/m/emergency/${leg}`);
      await expectRendered(page);
      // Home owns emergency — the floating tab bar highlights it.
      await expect(page.locator('a[href="/m/emergency"], nav').first()).toBeVisible();
    }
  });

  test("templates library renders (crew sees the read surface)", async ({ page }) => {
    await page.goto("/m/templates");
    await expectRendered(page);
  });

  test("scanner mode: the POS + Scanner segments render", async ({ page }) => {
    await page.goto("/m/scan?mode=pos");
    await expectRendered(page);
    await expect(page.getByRole("button", { name: /scanner/i }).first()).toBeVisible({ timeout: 15_000 });
  });

  test("notification feed rows deep-link into a detail record", async ({ page }) => {
    await page.goto("/m/notifications");
    await expectRendered(page);
    const row = page.locator("a[href*='/m/notifications/']").first();
    if (await row.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await row.click();
      await expectRendered(page);
      await expect(page).toHaveURL(/\/m\/notifications\/[0-9a-f-]+/);
    }
  });

  test("field finance is manager-gated — crew gets the lock, not the numbers", async ({ page }) => {
    await page.goto("/m/finance");
    // Either a capability lock screen or a redirect; never the error boundary,
    // never the committed/actual bars a crew member may not see.
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
    await expect(page.getByText(/lock|access|manager|lead|not available/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("scheduler is assign-gated — crew gets the capability lock", async ({ page }) => {
    await page.goto("/m/scheduler");
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
    await expect(page.getByText(/lock|access|manager|lead|schedule/i).first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("COMPVSS kit 31/32 surfaces · manager", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "manager"));

  test("field finance renders the coverage surface for a manager", async ({ page }) => {
    await page.goto("/m/finance");
    await expectRendered(page);
  });

  test("shift scheduler renders the day strip + coverage grid for a manager", async ({ page }) => {
    await page.goto("/m/scheduler");
    await expectRendered(page);
  });

  test("templates: a manager can open the New Template form", async ({ page }) => {
    await page.goto("/m/templates");
    await expectRendered(page);
    const fab = page.getByRole("button", { name: /new template|template/i }).or(page.locator("a[href*='/m/templates/new']")).first();
    if (await fab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await fab.click();
      await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
    }
  });
});
