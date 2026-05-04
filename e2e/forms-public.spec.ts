import { expect, test } from "playwright/test";

/**
 * forms-public
 *
 * Anonymous-shareable form flows that don't require auth:
 *   - /forms/[slug] — public form_defs submission (form_submissions row insert)
 *   - /offer/[token] — offer letter unlock + accept/decline
 *   - /proposals/[token] — public proposal portal
 *
 * These flows go through the service-role client server-side (because the
 * underlying tables are RLS-protected to org members only). The tests
 * verify the public-facing render + safe handling of nonexistent tokens.
 */

test.describe("public forms + tokens", () => {
  test("nonexistent form slug returns 404", async ({ page }) => {
    const response = await page.goto("/forms/nonexistent-form-slug-e2e");
    expect(response?.status()).toBe(404);
  });

  test("nonexistent proposal token returns 404", async ({ page }) => {
    const response = await page.goto("/proposals/nonexistent-token-e2e");
    expect(response?.status()).toBe(404);
  });

  test("nonexistent offer token returns 200 (security: same response as valid)", async ({ page }) => {
    // Per design, offer letter doesn't leak token validity — both return the
    // unlock form. The unlock attempt with an invalid code is what fails.
    const response = await page.goto("/offer/nonexistent-token-e2e");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toContainText(/access code|expired|enter/i);
  });

  test("changelog RSS returns valid XML", async ({ request }) => {
    const response = await request.get("/changelog.rss");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("xml");
    const body = await response.text();
    expect(body).toContain("<rss");
    expect(body).toContain("<channel>");
    expect(body).toContain("<item>");
  });

  test("sitemap.xml returns valid XML", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("xml");
    const body = await response.text();
    expect(body).toContain("<urlset");
  });

  test("robots.txt is served", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toMatch(/User-agent/i);
  });

  test("og default returns image/PNG", async ({ request }) => {
    const response = await request.get("/og");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/image|png/);
  });
});
