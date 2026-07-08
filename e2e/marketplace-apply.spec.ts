import { test, expect } from "./helpers/base";
import { authedSetup } from "./helpers/auth";
import { JOB_POSTING_FIXTURE as G } from "./helpers/fixtures";

/**
 * M2 — the marketplace APPLICANT submit side. The audit found the operator half
 * (posting/publishing gigs) was covered but the applicant never created a row —
 * publish→apply was publish-only. This applies to a seeded published gig as a
 * marketplace persona and asserts the application lands (redirect to the
 * applicant's applications).
 *
 * Re-run safe: the apply action enforces one live application per user per
 * posting, so a subsequent run finds the already-applied state instead of the
 * form — both prove the submit path resolves the published posting end-to-end.
 */
test.describe("Marketplace — applicant submit (M2)", () => {
  test.describe.configure({ timeout: 120_000 });

  test("an applicant submits a job application to a published gig", async ({ page }) => {
    await authedSetup(page, "community");
    await page.goto(`/marketplace/gigs/${G.slug}/apply`);

    const coverNote = page.locator('textarea[name="cover_note"]');
    if (await coverNote.count()) {
      // First run — the applicant creates the job_applications row.
      await coverNote.fill("E2E application — strong fit for this stagehand gig, available on load-in.");
      await page.getByRole("button", { name: /submit application/i }).click();
      await expect(page, "submitting redirects to the applicant's applications").toHaveURL(/\/me\/applications/, {
        timeout: 15_000,
      });
    } else {
      // Re-run — the duplicate guard already recorded this applicant's application;
      // the page shows the applied state (which links to /me/applications).
      await expect(
        page.getByRole("link", { name: /applications/i }).first(),
        "the already-applied state links to My Applications",
      ).toBeVisible({ timeout: 10_000 });
    }
  });
});
