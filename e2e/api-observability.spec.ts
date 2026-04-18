/**
 * Request-correlation + structured logging surface (from user's side).
 *
 * We can't read server logs from the browser, but we CAN assert:
 *  - A caller-supplied x-request-id is echoed back on all non-probe routes.
 *  - If the caller doesn't supply one, a new 32-char hex id is generated.
 *  - Server-Timing header includes an `mw;dur=<ms>` entry on app routes.
 *  - Rate-limit 429 responses carry retry-after + x-ratelimit-* headers.
 *  - Different routes get different request_ids (ids are per-request, not per-session).
 */
import { expect, test } from "playwright/test";

test.describe("request correlation headers", () => {
  test("caller x-request-id is echoed on app routes", async ({ request }) => {
    const rid = "my-caller-rid-" + Date.now();
    const r = await request.get("/api/v1/ai/conversations", { headers: { "x-request-id": rid } });
    expect(r.headers()["x-request-id"]).toBe(rid);
  });

  test("generated request id is 32-char hex when caller sends none", async ({ request }) => {
    const r = await request.get("/api/v1/me/preferences");
    const rid = r.headers()["x-request-id"];
    expect(rid).toBeTruthy();
    expect(rid!).toMatch(/^[0-9a-f]{32}$/);
  });

  test("two requests produce two distinct ids", async ({ request }) => {
    const [a, b] = await Promise.all([
      request.get("/api/v1/me/preferences"),
      request.get("/api/v1/ai/conversations"),
    ]);
    expect(a.headers()["x-request-id"]).not.toBe(b.headers()["x-request-id"]);
  });
});

test.describe("Server-Timing header", () => {
  test("app route includes mw;dur=N", async ({ request }) => {
    const r = await request.get("/api/v1/ai/conversations");
    const timing = r.headers()["server-timing"] ?? "";
    expect(timing).toMatch(/mw;dur=\d+(\.\d+)?/);
  });

  test("probe routes intentionally omit Server-Timing from middleware", async ({ request }) => {
    const r = await request.get("/api/v1/health/liveness");
    expect(r.headers()["server-timing"]).toBeFalsy();
  });
});

test.describe("rate-limit envelope when enforced", () => {
  test("429 responses carry retry-after + rate-limit metadata", async ({ request }) => {
    // Burst into /api/v1/auth/oauth POST (auth bucket: 10/min). We only need to
    // capture the first 429 to verify headers — no need to exhaust beyond.
    let first429: Awaited<ReturnType<typeof request.post>> | null = null;
    for (let i = 0; i < 15; i++) {
      const r = await request.post("/api/v1/auth/oauth", {
        data: { provider: "google" },
        failOnStatusCode: false,
      });
      if (r.status() === 429) {
        first429 = r;
        break;
      }
    }
    expect(first429, "never saw a 429 — rate limiter may be disabled").not.toBeNull();
    if (first429) {
      expect(first429.headers()["retry-after"]).toBeTruthy();
      expect(first429.headers()["x-ratelimit-bucket"]).toBe("auth");
      expect(first429.headers()["x-ratelimit-remaining"]).toBe("0");
      expect(first429.headers()["x-ratelimit-reset"]).toBeTruthy();
      const body = await first429.json();
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("rate_limited");
      expect(body.error.retryAfter).toEqual(expect.any(Number));
    }
  });
});

test.describe("cache-control on API routes", () => {
  test("mutating response should not be cacheable by shared caches", async ({ request }) => {
    const r = await request.post("/api/v1/me/delete", {
      data: { confirmPhrase: "delete my account" },
      failOnStatusCode: false,
    });
    const cc = (r.headers()["cache-control"] ?? "").toLowerCase();
    // Either Next default (no cache-control) or explicit no-store. Never "public".
    expect(cc).not.toContain("public");
  });
});
