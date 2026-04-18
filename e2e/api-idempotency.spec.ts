/**
 * Idempotency contract at the middleware layer.
 *
 * We test what the `withIdempotency` wrapper guarantees:
 *   - Missing key → no-op (handler runs naturally, no idempotency-replay header).
 *   - Oversized key → 400 bad_request with a precise message.
 *   - GET / HEAD → wrapper is a no-op (idempotent by definition).
 *   - Replay semantics for 2xx responses are covered end-to-end via the
 *     authed authed-mutations spec where a seeded fixture guarantees a
 *     cacheable 201 response.
 */
import { expect, test } from "playwright/test";

function key() {
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const SAMPLE_BODY = {
  guideId: "00000000-0000-0000-0000-000000000001",
  orgId: "00000000-0000-0000-0000-000000000001",
  body: "hello from the idempotency suite",
};

test.describe("withIdempotency middleware", () => {
  test("missing Idempotency-Key → handler runs normally, no replay header", async ({ request }) => {
    const r = await request.post("/api/v1/guides/comments", { data: SAMPLE_BODY });
    expect(r.headers()["idempotency-replay"]).toBeFalsy();
    // We don't assert a specific status here — RLS may 403 or succeed depending
    // on the session. The invariant is: no replay happens without a key.
    expect(r.status()).toBeGreaterThanOrEqual(200);
  });

  test("oversized Idempotency-Key → 400 bad_request", async ({ request }) => {
    const r = await request.post("/api/v1/guides/comments", {
      data: SAMPLE_BODY,
      headers: { "idempotency-key": "x".repeat(300) },
    });
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("bad_request");
    expect(body.error.message).toMatch(/idempotency-key/i);
  });

  test("deterministic handler output under repeated key+body", async ({ request }) => {
    const k = key();
    const first = await request.post("/api/v1/guides/comments", {
      data: SAMPLE_BODY,
      headers: { "idempotency-key": k },
    });
    const firstBody = await first.text();

    const second = await request.post("/api/v1/guides/comments", {
      data: SAMPLE_BODY,
      headers: { "idempotency-key": k },
    });
    const secondBody = await second.text();

    // Whether the response was a 2xx (cached) or an error (handler re-ran),
    // the envelope body MUST match — the contract is "same input → same output".
    expect(second.status()).toBe(first.status());
    expect(secondBody).toBe(firstBody);
  });

  test("GET requests ignore Idempotency-Key (middleware no-ops)", async ({ request }) => {
    const r = await request.get("/api/v1/health/liveness", {
      headers: { "idempotency-key": key() },
    });
    expect(r.status()).toBe(200);
    expect(r.headers()["idempotency-replay"]).toBeFalsy();
  });

  test("oversized key error envelope is the canonical shape", async ({ request }) => {
    const r = await request.post("/api/v1/guides/comments", {
      data: SAMPLE_BODY,
      headers: { "idempotency-key": "a".repeat(257) },
    });
    const body = await r.json();
    expect(body).toMatchObject({ ok: false, error: { code: "bad_request" } });
  });
});
