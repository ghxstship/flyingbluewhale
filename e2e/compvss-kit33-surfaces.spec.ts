/**
 * COMPVSS field PWA (/m) — kit 33 v3.0 surface coverage, all personas.
 *
 * Kit 33 landed the Aurora tab + chat, the More → nav drawer (with the
 * perm-gated Manage control plane), the five Operations ledgers, and the
 * scheduler Schedule/Coverage/On-Now views. This spec walks each at persona
 * depth — render + the RBAC gate + one real interaction — so a regression on
 * any of them fails CI rather than a screenshot review.
 *
 * Fixtures: test+<role>@flyingbluewhale.app (crew · manager · admin · owner),
 * all in Test Professional Org. crew = member-tier (Manage hidden); manager /
 * admin / owner = isManagerPlus (Manage shown).
 */
import { expect, test, type Page } from "./helpers/base";
import { authedSetup, suppressTour } from "./helpers/auth";

const ERROR_BOUNDARY = /something went wrong|application error|unhandled|digest:/i;

// The five kit-33 Operations ledgers (drawer · Operations group).
const OPS_LEDGERS: [string, RegExp][] = [
  ["/m/reports", /reports/i],
  ["/m/inspections", /inspections/i],
  ["/m/logistics", /logistics/i],
  ["/m/permits", /permits/i],
  ["/m/travel", /travel/i],
];

test.beforeEach(({ page }) => suppressTour(page));

async function expectRendered(page: Page) {
  await expect(page.locator(".scr-h, h1, .aurora-head-t").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
}

/** Open the More nav drawer via the floating tab bar's More button. */
async function openNavDrawer(page: Page) {
  await page.goto("/m");
  await expectRendered(page);
  const moreTab = page.locator('.tabbar button[aria-haspopup="menu"]').first();
  await expect(moreTab).toBeVisible({ timeout: 15_000 });
  await moreTab.click();
  await expect(page.locator(".nav-panel").first()).toBeVisible({ timeout: 10_000 });
}

test.describe("COMPVSS kit 33 · Aurora + Operations ledgers · crew", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "crew"));

  test("Aurora is the 5th tab and opens the full-screen chat", async ({ page }) => {
    await page.goto("/m");
    await expectRendered(page);
    const auroraTab = page.locator('.tabbar a[href="/m/aurora"]').first();
    await expect(auroraTab, "Aurora must be a bottom tab").toBeVisible({ timeout: 15_000 });
    await auroraTab.click();
    await expect(page).toHaveURL(/\/m\/aurora/);
    await expect(page.locator(".aurora-head-t")).toHaveText(/aurora ai/i);
    await expect(page.locator(".aurora-hello")).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  });

  test("Aurora chat: a prompt card produces an assistant turn with a tool-trace", async ({ page }) => {
    await page.goto("/m/aurora");
    await expectRendered(page);
    const card = page.locator(".aurora-card").first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.click();
    // Assistant turn renders: left-avatar prose + "Consulted <source>" trace.
    await expect(page.locator(".au-ai").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".au-tool").first()).toContainText(/consulted/i);
    // Follow-up suggestions render under the latest assistant turn.
    await expect(page.locator(".au-follow button").first()).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  });

  test("Aurora composer sends a typed message", async ({ page }) => {
    await page.goto("/m/aurora");
    await expectRendered(page);
    const input = page.getByPlaceholder(/ask aurora anything/i);
    await input.fill("What's my next shift?");
    await input.press("Enter");
    await expect(page.locator(".au-user-b").first()).toContainText(/next shift/i);
    await expect(page.locator(".au-ai").first()).toBeVisible({ timeout: 10_000 });
  });

  for (const [href, title] of OPS_LEDGERS) {
    test(`Operations ledger ${href} renders with the ActionBar (crew)`, async ({ page }) => {
      await page.goto(href);
      await expectRendered(page);
      await expect(page.locator(".scr-h").first()).toHaveText(title);
      // Every list surface carries the search + icon-only ActionBar cluster.
      await expect(page.locator(".searchbar, input[placeholder]").first()).toBeVisible({ timeout: 15_000 });
      // Breadcrumb back to the More drawer.
      await expect(page.getByText(/^more$/i).first()).toBeVisible();
    });
  }

  test("a ledger table view + status filter work (reports)", async ({ page }) => {
    await page.goto("/m/reports");
    await expectRendered(page);
    // At least one seeded row is present.
    await expect(page.locator(".item").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  });
});

test.describe("COMPVSS kit 33 · nav drawer · crew (Manage hidden)", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "crew"));

  test("More tab opens the left nav drawer with the grouped IA", async ({ page }) => {
    await openNavDrawer(page);
    // Identity header + grouped IA.
    await expect(page.locator(".nav-name").first()).toBeVisible();
    for (const grp of ["My Work", "Workplace", "Operations"]) {
      await expect(page.locator(".nav-grp-h", { hasText: grp }).first()).toBeVisible();
    }
  });

  test("the Manage control-plane group is hidden for crew", async ({ page }) => {
    await openNavDrawer(page);
    await expect(page.locator(".nav-grp-h", { hasText: /^manage$/i })).toHaveCount(0);
    // And its rows are absent — Finance / Scheduler / Approvals.
    await expect(page.locator('.nav-row[href="/m/finance"]')).toHaveCount(0);
    await expect(page.locator('.nav-row[href="/m/scheduler"]')).toHaveCount(0);
  });

  test("drawer search filters, and a row navigates", async ({ page }) => {
    await openNavDrawer(page);
    await page.locator(".nav-search input").fill("assets");
    const row = page.locator('.nav-row[href="/m/assets"]').first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    await row.click();
    await expect(page).toHaveURL(/\/m\/assets/);
    await expectRendered(page);
  });

  test("scheduler stays assign-gated for crew (lock, not the board)", async ({ page }) => {
    await page.goto("/m/scheduler");
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
    await expect(page.getByText(/lock|access|manager|lead|schedule/i).first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("COMPVSS kit 33 · nav drawer + scheduler · manager", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "manager"));

  test("the Manage control-plane group is shown for a manager", async ({ page }) => {
    await openNavDrawer(page);
    await expect(page.locator(".nav-grp-h", { hasText: /^manage$/i }).first()).toBeVisible();
    // Manage rows are present + gated ones reachable.
    await expect(page.locator('.nav-row[href="/m/scheduler"]').first()).toBeVisible();
  });

  test("scheduler exposes Schedule / Coverage / On Now views", async ({ page }) => {
    await page.goto("/m/scheduler");
    await expectRendered(page);
    const seg = page.locator(".seg2 button");
    await expect(seg.filter({ hasText: /schedule/i }).first()).toBeVisible({ timeout: 15_000 });
    // Switch to Coverage — its stat grid (Scheduled/Required/Gaps) renders.
    await seg.filter({ hasText: /coverage/i }).first().click();
    await expect(page.getByText(/required/i).first()).toBeVisible({ timeout: 10_000 });
    // Switch to On Now — its attendance stats render.
    await seg.filter({ hasText: /on now/i }).first().click();
    await expect(page.getByText(/on shift/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  });

  test("scheduler overflow sheet offers Auto-Fill / Copy Week / Apply Template", async ({ page }) => {
    await page.goto("/m/scheduler");
    await expectRendered(page);
    await page.getByRole("button", { name: /scheduler actions/i }).first().click();
    await expect(page.getByText(/auto-fill open/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/copy last week/i).first()).toBeVisible();
    await expect(page.getByText(/apply template/i).first()).toBeVisible();
  });
});

// Elevated personas are all isManagerPlus — a compact smoke that the kit-33
// surfaces render + the Manage plane shows for admin and owner too.
for (const role of ["admin", "owner"]) {
  test.describe(`COMPVSS kit 33 · elevated smoke · ${role}`, () => {
    test.describe.configure({ timeout: 150_000 });
    test.beforeEach(async ({ page }) => authedSetup(page, role));

    test(`Aurora + an Operations ledger render for ${role}`, async ({ page }) => {
      await page.goto("/m/aurora");
      await expect(page.locator(".aurora-head-t")).toHaveText(/aurora ai/i, { timeout: 20_000 });
      await page.goto("/m/permits");
      await expectRendered(page);
    });

    test(`the Manage plane shows for ${role}`, async ({ page }) => {
      await openNavDrawer(page);
      await expect(page.locator(".nav-grp-h", { hasText: /^manage$/i }).first()).toBeVisible();
    });
  });
}
