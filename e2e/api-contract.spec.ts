/**
 * API v1 envelope contract.
 *
 * Asserts that every /api/v1/* response — success OR error — conforms to
 * `{ok:true, data}` / `{ok:false, error:{code,message}}`. Any endpoint that
 * returns a bare payload, omits `ok`, or uses a non-canonical error code
 * fails this suite. Paired with the eslint `no-restricted-syntax` rule on
 * `NextResponse.json` so the contract can't drift out of the lib/api helpers.
 */
import { expect, test } from "playwright/test";

const ALLOWED_ERROR_CODES = new Set([
  "bad_request",
  "unauthorized",
  "forbidden",
  "not_found",
  "conflict",
  "rate_limited",
  "internal",
]);

function assertEnvelope(status: number, body: unknown) {
  expect(body, "response body must be an object").toEqual(expect.any(Object));
  const b = body as Record<string, unknown>;
  expect(b.ok, "envelope must include `ok`").toBeDefined();
  if (b.ok === true) {
    expect(b).toHaveProperty("data");
  } else {
    expect(b.ok).toBe(false);
    const err = b.error as Record<string, unknown> | undefined;
    expect(err, "error envelope must include `error`").toBeDefined();
    expect(err!.code, `unexpected error code; status=${status}`).toEqual(expect.any(String));
    expect(ALLOWED_ERROR_CODES.has(err!.code as string)).toBe(true);
    expect(err!.message).toEqual(expect.any(String));
  }
}

test.describe("API v1 envelope contract", () => {
  test("GET /api/v1/health (legacy)", async ({ request }) => {
    const r = await request.get("/api/v1/health");
    assertEnvelope(r.status(), await r.json());
  });

  test("GET /api/v1/health/liveness", async ({ request }) => {
    const r = await request.get("/api/v1/health/liveness");
    expect(r.status()).toBe(200);
    assertEnvelope(r.status(), await r.json());
  });

  test("GET /api/v1/health/readiness", async ({ request }) => {
    const r = await request.get("/api/v1/health/readiness");
    // readiness can 200 (ready) or 500 (degraded) — envelope must hold either way
    expect([200, 500]).toContain(r.status());
    assertEnvelope(r.status(), await r.json());
  });

  test("unauth'd GET /api/v1/ai/conversations returns unauthorized envelope", async ({ request }) => {
    const r = await request.get("/api/v1/ai/conversations");
    expect(r.status()).toBe(401);
    const body = await r.json();
    assertEnvelope(r.status(), body);
    expect(body.error.code).toBe("unauthorized");
  });

  test("unauth'd GET /api/v1/me/preferences returns unauthorized envelope", async ({ request }) => {
    const r = await request.get("/api/v1/me/preferences");
    expect(r.status()).toBe(401);
    const body = await r.json();
    assertEnvelope(r.status(), body);
    expect(body.error.code).toBe("unauthorized");
  });

  test("POST /api/v1/me/delete requires auth", async ({ request }) => {
    const r = await request.post("/api/v1/me/delete", { data: { confirmPhrase: "delete my account" } });
    expect(r.status()).toBe(401);
    assertEnvelope(r.status(), await r.json());
  });

  test("bad JSON body returns validation envelope", async ({ request }) => {
    const r = await request.post("/api/v1/me/delete", {
      data: "not-json",
      headers: { "content-type": "application/json" },
    });
    expect([400, 401]).toContain(r.status());
    const body = await r.json();
    assertEnvelope(r.status(), body);
  });

  test("GET /api/v1/auth/oauth rejects invalid provider with a safe redirect", async ({ request }) => {
    // Not a JSON endpoint — it redirects. Verify same-origin only.
    const r = await request.get("/api/v1/auth/oauth?provider=evil&next=https://attacker.test/", {
      maxRedirects: 0,
    });
    expect([302, 303, 307]).toContain(r.status());
    const loc = r.headers()["location"] ?? "";
    expect(loc.startsWith("/") || loc.includes("/login"), `open-redirect suspect: ${loc}`).toBe(true);
  });

  test("X-Request-Id header propagates", async ({ request }) => {
    const r = await request.get("/api/v1/health", { headers: { "x-request-id": "test-contract-id" } });
    expect(r.headers()["x-request-id"]).toBe("test-contract-id");
  });

  test("Server-Timing header is set by middleware on app routes", async ({ request }) => {
    const r = await request.get("/api/v1/ai/conversations");
    const timing = r.headers()["server-timing"] ?? "";
    // Probe routes bypass middleware on purpose, but app routes must have mw;dur=...
    expect(timing).toMatch(/mw;dur=/);
  });
});
