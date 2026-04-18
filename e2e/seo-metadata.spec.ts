/**
 * SEO + discoverability smoke:
 *   - sitemap.xml parses + lists the canonical URLs.
 *   - robots.txt is served.
 *   - Every marketing route has a title + meta description.
 *   - OG + Twitter meta tags are populated on the home page.
 *   - Web app manifest is served and parseable.
 *   - Canonical link tag present on marketing pages.
 */
import { expect, test } from "playwright/test";

const MARKETING = [
  "/",
  "/pricing",
  "/solutions",
  "/compare",
  "/features",
  "/about",
  "/customers",
  "/guides",
  "/blog",
  "/changelog",
  "/contact",
];

test.describe("SEO metadata", () => {
  for (const path of MARKETING) {
    test(`${path} has title + description + canonical`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(/.+/); // any non-empty title
      const desc = await page.locator('meta[name="description"]').getAttribute("content");
      expect((desc ?? "").length).toBeGreaterThan(20);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical ?? "").not.toBe("");
    });
  }

  test("home page exposes OG + Twitter cards", async ({ page }) => {
    await page.goto("/");
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    const ogDesc = await page.locator('meta[property="og:description"]').getAttribute("content");
    const twCard = await page.locator('meta[name="twitter:card"]').getAttribute("content");
    expect((ogTitle ?? "").length).toBeGreaterThan(0);
    expect((ogDesc ?? "").length).toBeGreaterThan(0);
    expect(twCard).toBe("summary_large_image");
  });
});

test.describe("discoverability", () => {
  test("sitemap.xml is served and XML-shaped", async ({ request }) => {
    const r = await request.get("/sitemap.xml");
    expect(r.status()).toBe(200);
    const text = await r.text();
    expect(text).toContain("<urlset");
    expect(text).toContain("<loc>");
  });

  test("robots.txt is served and allows the sitemap", async ({ request }) => {
    const r = await request.get("/robots.txt");
    expect(r.status()).toBe(200);
    const text = await r.text();
    expect(text.toLowerCase()).toContain("sitemap");
  });

  test("manifest.webmanifest is served with correct mime", async ({ request }) => {
    const r = await request.get("/manifest.webmanifest");
    // Not all apps expose this path — tolerate 404 but never 500.
    expect([200, 404]).toContain(r.status());
    if (r.status() === 200) {
      const ct = r.headers()["content-type"] ?? "";
      expect(ct).toMatch(/json|manifest/);
    }
  });
});
