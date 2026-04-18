/**
 * Boundary + safety probes that don't belong in a happy-path contract suite:
 *  - OAuth `next` open-redirect variants (protocol, protocol-relative, javascript:).
 *  - Invalid UUIDs on every [id] route return 400 bad_request.
 *  - Oversized JSON bodies don't crash the server.
 *  - Non-JSON bodies on JSON endpoints return 400.
 *  - HTTP methods not listed in the spec return 405 or 404 (not 500).
 */
import { expect, test } from "playwright/test";

test.describe("OAuth `next` same-origin enforcement", () => {
  const CASES: Array<{ label: string; next: string }> = [
    { label: "absolute https", next: "https://attacker.test/phish" },
    { label: "absolute http", next: "http://attacker.test/phish" },
    { label: "protocol-relative //", next: "//attacker.test/phish" },
    { label: "javascript: scheme", next: "javascript:alert(1)" },
    { label: "data: scheme", next: "data:text/html,<script>alert(1)</script>" },
    { label: "backslash trick", next: "/\\attacker.test" },
  ];
  for (const { label, next } of CASES) {
    test(`rejects ${label} via fallback to /me`, async ({ request }) => {
      const r = await request.get(
        `/api/v1/auth/oauth?provider=google&next=${encodeURIComponent(next)}`,
        { maxRedirects: 0 },
      );
      // Either the route 303/307 redirects somewhere safe, or Supabase OAuth
      // is disabled and it redirects to /login with an error. Either way the
      // Location must not be off-origin.
      expect([302, 303, 307]).toContain(r.status());
      const loc = r.headers()["location"] ?? "";
      // Must be same-origin: either a relative path starting with "/" and not
      // "//", or an absolute URL with our own host. Never attacker.test.
      expect(loc).not.toContain("attacker.test");
      expect(loc.startsWith("//")).toBe(false);
      expect(loc.toLowerCase().startsWith("javascript:")).toBe(false);
      expect(loc.toLowerCase().startsWith("data:")).toBe(false);
    });
  }

  test("rejects unknown provider gracefully", async ({ request }) => {
    const r = await request.get("/api/v1/auth/oauth?provider=evil", { maxRedirects: 0 });
    expect([302, 303, 307]).toContain(r.status());
    expect(r.headers()["location"]).toContain("/login");
  });
});

test.describe("UUID validation on [id] routes", () => {
  const ROUTES = [
    { method: "get" as const, path: "/api/v1/ai/conversations/not-a-uuid" },
    { method: "delete" as const, path: "/api/v1/ai/conversations/not-a-uuid" },
    { method: "get" as const, path: "/api/v1/deliverables/not-a-uuid/download" },
  ];
  for (const { method, path } of ROUTES) {
    test(`${method.toUpperCase()} ${path} → 400 bad_request`, async ({ request }) => {
      const r = await request[method](path, { maxRedirects: 0 });
      // Some routes gate on auth first. Both 400 and 401 are acceptable but NOT 500.
      expect([400, 401]).toContain(r.status());
      const body = await r.json();
      expect(body.ok).toBe(false);
      expect(["bad_request", "unauthorized"]).toContain(body.error.code);
    });
  }
});

test.describe("robust input handling", () => {
  test("oversized JSON body on a POST endpoint doesn't crash", async ({ request }) => {
    const huge = { body: "x".repeat(1024 * 1024), guideId: "00000000-0000-0000-0000-000000000000", orgId: "00000000-0000-0000-0000-000000000000" };
    const r = await request.post("/api/v1/guides/comments", { data: huge });
    // Zod caps comment body at 2000 chars → expect 400 from validation layer.
    expect([400, 413]).toContain(r.status());
    const body = await r.json();
    expect(body.ok).toBe(false);
  });

  test("non-JSON body on JSON endpoint returns 400", async ({ request }) => {
    const r = await request.post("/api/v1/me/delete", {
      data: "this is not json",
      headers: { "content-type": "application/json" },
    });
    expect([400, 401]).toContain(r.status());
    const body = await r.json();
    expect(body.ok).toBe(false);
  });

  test("DELETE on a GET-only endpoint returns 405 or 404", async ({ request }) => {
    const r = await request.delete("/api/v1/health/liveness");
    expect([404, 405]).toContain(r.status());
  });
});

test.describe("CORS + same-origin", () => {
  test("cross-origin POST does not return Access-Control-Allow-Origin: *", async ({ request }) => {
    const r = await request.post("/api/v1/me/delete", {
      data: { confirmPhrase: "delete my account" },
      headers: { origin: "https://attacker.test" },
    });
    const acao = r.headers()["access-control-allow-origin"] ?? "";
    expect(acao).not.toBe("*");
  });
});
