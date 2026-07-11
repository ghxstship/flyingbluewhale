import { test, expect } from "./helpers/base";
import { dismissConsent, loginAndSwitchWorkspace, suppressTour } from "./helpers/auth";
import { FIXTURE_PROJECT } from "./helpers/fixtures";

/**
 * Kit 27 — recipient packet portal + submissions (P3).
 *
 * The portal token is the recipient's only credential: without one, the
 * shared /p/[slug]/advancing surface must NOT leak packet content — an
 * org member gets the read-only outline preview at most, and an invalid
 * token falls back to the locked state (never a 500).
 */
test.beforeEach(async ({ page }) => {
  await suppressTour(page);
});

test.describe("Advance packet portal — token boundary (kit 27)", () => {
  test("an invalid token falls back to the locked state, not an error", async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "member", FIXTURE_PROJECT.orgId);
    await page.goto(`/p/${FIXTURE_PROJECT.slug}/advancing?t=not-a-real-token-000000000000000000`);
    // Member of the org + garbage token → operator preview (if a packet
    // exists) or the locked empty state — never packet-recipient content.
    const locked = page.getByText("Your Advance Link Is Required");
    const preview = page.getByText("Operator Preview");
    await expect(locked.or(preview).first()).toBeVisible({ timeout: 15_000 });
  });

  test("an org member without a token never sees recipient submission forms", async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "member", FIXTURE_PROJECT.orgId);
    await page.goto(`/p/${FIXTURE_PROJECT.slug}/advancing`);
    await expect(page.getByRole("button", { name: "Add Row" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Submit Section" })).toHaveCount(0);
  });

  test("the submissions funnel is visible to operators on the tracking board route", async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "owner", FIXTURE_PROJECT.orgId);
    await page.goto("/studio/comms/advances");
    // The board lists batches; an empty org shows the teach-first empty
    // state (list-honesty: no stub, no silent blank).
    const empty = page.getByText("No Advance Sends Yet");
    const table = page.locator("table");
    await expect(empty.or(table).first()).toBeVisible({ timeout: 15_000 });
  });
});
