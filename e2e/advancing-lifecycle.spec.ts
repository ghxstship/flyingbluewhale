import { test, expect } from "./helpers/base";
import { dismissConsent, loginAndSwitchWorkspace } from "./helpers/auth";
import { ADVANCING_FIXTURE as A } from "./helpers/fixtures";

/**
 * C3 — advancing: the party-scoped, cross-shell read. The unified `assignments`
 * domain drives ONE lifecycle across three shells (ATLVS authoring · GVTEWAY
 * portal · COMPVSS field). The audit found this had ZERO functional coverage —
 * no test asserted a party actually sees THEIR assignment (with its
 * fulfillment_state) on the portal or the field shell, nor that the read is
 * party-scoped.
 *
 * This binds to a seeded `issued` credential whose party_user_id is test+crew
 * (e2e/helpers/fixtures.ts). It asserts the SAME assignment surfaces on both
 * downstream shells, and that a different org member does NOT see it —
 * listMyAssignments filters on party_user_id, so this is the party-scoping
 * guarantee. (It also exercises the /p/[slug]/crew/advances route that D3 just
 * made reachable from the crew rail.)
 */
test.describe("Advancing — party-scoped cross-shell read (C3)", () => {
  test("crew sees THEIR assignment on the COMPVSS field shell (/m/advances)", async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, A.partyRole, A.orgId);
    await page.goto("/m/advances");
    await expect(page.getByText(A.title), "crew's issued credential is listed on mobile").toBeVisible({
      timeout: 15_000,
    });
  });

  test("crew sees the SAME assignment on the GVTEWAY portal (/p/[slug]/crew/advances)", async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, A.partyRole, A.orgId);
    await page.goto(`/p/${A.projectSlug}/crew/advances`);
    await expect(page.getByText(A.title), "same assignment domain, second shell (portal)").toBeVisible({
      timeout: 15_000,
    });
  });

  test("party scoping: a different member does NOT see crew's assignment", async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "member", A.orgId);
    await page.goto("/m/advances");
    // listMyAssignments filters party_user_id = self — the credential is crew's.
    await expect(page.getByText(A.title), "member must not see another party's assignment").toHaveCount(0);
  });
});
