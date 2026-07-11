import { test, expect } from "./helpers/base";
import { dismissConsent, loginAndSwitchWorkspace, suppressTour } from "./helpers/auth";
import { TEST_ORGS } from "./helpers/fixtures";

/**
 * Kit 27 — bespoke scheduler (P4): the /studio/scheduler admin and the
 * public /book/[token] flow. The booking page is token-gated and
 * anonymous: an unknown token must resolve to the inactive-link state
 * (not a 500, not slug enumeration).
 */
test.beforeEach(async ({ page }) => {
  await suppressTour(page);
});

test.describe("Scheduler — admin + public booking (kit 27)", () => {
  test("the scheduler admin lists event types with metrics", async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "owner", TEST_ORGS.professional);
    await page.goto("/studio/scheduler");
    await expect(page.getByRole("heading", { name: "Scheduler" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Event Types").first()).toBeVisible({ timeout: 15_000 });
  });

  test("the new event type form carries the Calendly-parity rule fields", async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "owner", TEST_ORGS.professional);
    await page.goto("/studio/scheduler/new");
    await expect(page.getByLabel("Duration (minutes)")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel("Minimum Notice (minutes)")).toBeVisible();
    await expect(page.getByLabel("Timezone (IANA)")).toBeVisible();
  });

  test("an unknown public booking token shows the inactive-link state, anonymously", async ({ page }) => {
    await dismissConsent(page);
    await page.goto("/book/not-a-real-token-00000000000000000000");
    // Token resolution rides the service-role client; a bare local target
    // without SUPABASE_SERVICE_ROLE_KEY renders the unavailable state instead.
    const body = await page.textContent("body");
    test.skip(
      Boolean(body?.includes("Booking is unavailable right now")),
      "token resolution needs SUPABASE_SERVICE_ROLE_KEY on the target",
    );
    await expect(page.getByText("This Booking Link Is Not Active")).toBeVisible({ timeout: 15_000 });
  });
});
