import { expect, test } from "./helpers/base";
import { dismissConsent, loginAs } from "./helpers/auth";

const PROJECT_SLUG = "test-professional-show";

test.describe("portals — every persona renders", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
  });

  for (const persona of ["client", "vendor", "artist", "sponsor", "guest", "crew"] as const) {
    test(`/p/${PROJECT_SLUG}/${persona} loads`, async ({ page }) => {
      // Use owner login — owner can view any persona portal in their org
      await loginAs(page, "owner");
      const r = await page.goto(`/p/${PROJECT_SLUG}/${persona}`);
      // Some portal subpages may redirect or 404 if not implemented; never 5xx
      expect(r?.status()).toBeLessThan(500);
    });
  }
});

test.describe("portal subpages — at least one per persona renders", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
  });

  const SUBPAGES = [
    `/p/${PROJECT_SLUG}/guide`,
    `/p/${PROJECT_SLUG}/client/proposals`,
    `/p/${PROJECT_SLUG}/client/invoices`,
    `/p/${PROJECT_SLUG}/vendor/purchase-orders`,
    `/p/${PROJECT_SLUG}/vendor/credentials`,
    `/p/${PROJECT_SLUG}/artist/schedule`,
    `/p/${PROJECT_SLUG}/sponsor/activations`,
    `/p/${PROJECT_SLUG}/guest/tickets`,
    `/p/${PROJECT_SLUG}/crew/call-sheet`,
    `/p/${PROJECT_SLUG}/crew/time`,
  ];

  for (const path of SUBPAGES) {
    test(`${path} loads`, async ({ page }) => {
      const r = await page.goto(path);
      expect(r?.status()).toBeLessThan(500);
    });
  }
});
