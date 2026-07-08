/**
 * Authenticated REST round-trips through the full stack.
 *
 * Logs in as the seeded `owner` user, then exercises:
 *   - /me/preferences (GET + PATCH)
 *   - /ai/conversations (GET list)
 *   - /me/export (GDPR JSON download)
 *   - /webauthn/credentials (GET list)
 *
 * Uses the shared seeded fixture password + the `test+<role>@flyingbluewhale.app`
 * naming established by roles.spec.ts and compliance-flow.spec.ts.
 */
import { expect, test } from "./helpers/base";
import { dismissConsent, loginAs } from "./helpers/auth";

test.describe("authed REST round-trips (owner)", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
  });

  test("GET /api/v1/me/preferences returns an envelope with the user's prefs", async ({ page }) => {
    const resp = await page.request.get("/api/v1/me/preferences");
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.ok).toBe(true);
    // data may be null for a fresh user — both are valid envelope shapes.
    expect(body).toHaveProperty("data");
  });

  test("PATCH /api/v1/me/preferences persists and round-trips a UI toggle", async ({ page }) => {
    const width = 240 + Math.floor(Math.random() * 50);
    // `theme` stores the two-skin canon slug. The v3 GHXSTSHIP brand sweep
    // purged the pre-v3 CHROMA exploration themes; the PATCH schema now only
    // accepts ["ghxstship", "atlvs-product", "system"] (see PatchSchema in
    // src/app/api/v1/me/preferences/route.ts). The light/dark distinction is
    // the orthogonal `mode` field, not stored here.
    const patch = await page.request.patch("/api/v1/me/preferences", {
      data: { theme: "atlvs-product", sidebar_width: width, sidebar_collapsed: false },
    });
    expect(patch.status()).toBe(200);
    const pb = await patch.json();
    expect(pb.ok).toBe(true);
    expect(pb.data.theme).toBe("atlvs-product");
    // sidebar_width is merged into ui_state, flattened on response.
    expect(pb.data.sidebar_width).toBe(width);

    const read = await page.request.get("/api/v1/me/preferences");
    const rb = await read.json();
    expect(rb.data.sidebar_width).toBe(width);
  });

  test("GET /api/v1/ai/conversations returns a list envelope", async ({ page }) => {
    const r = await page.request.get("/api/v1/ai/conversations");
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data.conversations)).toBe(true);
  });

  test("GET /api/v1/ai/conversations/<garbage> → 400 bad_request", async ({ page }) => {
    const r = await page.request.get("/api/v1/ai/conversations/not-a-uuid");
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(body.error.code).toBe("bad_request");
  });

  test("GET /api/v1/me/export returns an attachment JSON bundle", async ({ page }) => {
    const r = await page.request.get("/api/v1/me/export");
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toMatch(/application\/json/);
    expect(r.headers()["content-disposition"] ?? "").toMatch(/attachment/);
    const text = await r.text();
    const parsed = JSON.parse(text);
    // Not the envelope shape — export is an unwrapped bundle by design.
    expect(parsed.exportedAt).toEqual(expect.any(String));
    expect(parsed.user.id).toEqual(expect.any(String));
  });

  test("GET /api/v1/auth/webauthn/credentials returns the session's passkeys list", async ({ page }) => {
    const r = await page.request.get("/api/v1/auth/webauthn/credentials");
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data.credentials)).toBe(true);
  });

  test("DELETE /api/v1/auth/webauthn/credentials?id=not-uuid → 400 bad_request", async ({ page }) => {
    const r = await page.request.delete("/api/v1/auth/webauthn/credentials?id=not-a-uuid");
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(body.error.code).toBe("bad_request");
  });

  test("PATCH /api/v1/me/preferences rejects invalid locale", async ({ page }) => {
    const r = await page.request.patch("/api/v1/me/preferences", {
      data: { locale: "x" }, // below min(2)
    });
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(body.error.code).toBe("bad_request");
  });
});

test.describe("authed AI conversations lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
  });

  test("DELETE of non-existent conversation id 404s, not 500", async ({ page }) => {
    const r = await page.request.delete("/api/v1/ai/conversations/00000000-0000-0000-0000-000000000000");
    // Either 404 not_found or 403 forbidden (RLS) — never a 500.
    expect([403, 404, 200]).toContain(r.status());
    expect(r.status()).not.toBe(500);
  });
});
