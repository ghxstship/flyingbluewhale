import { expect, test } from "playwright/test";
import { dismissConsent } from "./helpers/auth";

test.describe("marketing", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
  });

  test("home renders hero + CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
    // Hero primary CTA is "Start building free" → /signup
    // (marketing hero ctaPrimary in src/messages/en.json).
    await expect(page.getByRole("link", { name: /start building free/i }).first()).toBeVisible();
  });

  test("pricing shows 4 tiers + comparison table", async ({ page }) => {
    await page.goto("/pricing");
    // Canonical tier set per memory feedback_marketing_voice.md and
    // src/app/(marketing)/pricing/page.tsx (tier keys: free/crew/production/festival).
    for (const tier of ["Free", "Crew", "Production", "Festival"]) {
      await expect(page.getByText(tier, { exact: false }).first()).toBeVisible();
    }
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("solutions index renders 3 apps", async ({ page }) => {
    await page.goto("/solutions");
    // Brand names render as <Wordmark role="img" aria-label="..."> lockups
    // (commit f2b2b543), not visible text nodes.
    await expect(page.getByRole("img", { name: /atlvs/i }).first()).toBeVisible();
    await expect(page.getByRole("img", { name: /gvteway/i }).first()).toBeVisible();
    await expect(page.getByRole("img", { name: /compvss/i }).first()).toBeVisible();
  });

  test("compare page lists competitor cards", async ({ page }) => {
    await page.goto("/compare");
    // COMPARE_LIST in src/lib/compare.ts now carries 21 competitor cards;
    // each card is a Link whose accessible name includes the competitor.
    // Assert the three canonical comparisons still resolve uniquely.
    await expect(page.getByRole("link", { name: /asana/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /monday/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /spreadsheets/i }).first()).toBeVisible();
  });

  test("guides + blog + community each list at least one entry", async ({ page }) => {
    for (const path of ["/guides", "/blog", "/community"]) {
      await page.goto(path);
      await expect(page.getByRole("link").first()).toBeVisible();
    }
  });

  test("footer has 5 nav columns", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    // The 5 column headings (marketingFooterGroups minus Legal). Legal moved to
    // the bottom bar as Terms/Privacy links, not a column — see (marketing)/layout.tsx.
    for (const heading of ["Product", "Industries", "Resources", "Compare", "Studio"]) {
      await expect(footer.getByText(heading, { exact: true })).toBeVisible();
    }
    // Legal now lives in the bottom bar.
    await expect(footer.getByRole("link", { name: /privacy/i }).first()).toBeVisible();
  });

  test("sitemap + robots serve", async ({ request }) => {
    const r1 = await request.get("/robots.txt");
    expect(r1.ok()).toBeTruthy();
    const r2 = await request.get("/sitemap.xml");
    expect(r2.ok()).toBeTruthy();
  });
});
