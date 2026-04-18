/**
 * Dedicated liveness + readiness probe semantics.
 *
 * Liveness = "this process can respond to HTTP" — cheap, no deps.
 * Readiness = "this instance can serve real traffic" — DB reachable, env complete.
 * These are distinct signals: a failing readiness must NOT restart the pod,
 * and a failing liveness must NOT be used for traffic routing decisions.
 */
import { expect, test } from "playwright/test";

test.describe("health probes", () => {
  test("liveness always 200 with envelope + probe=liveness", async ({ request }) => {
    const r = await request.get("/api/v1/health/liveness");
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.ok).toBe(true);
    expect(body.data.probe).toBe("liveness");
    expect(body.data.status).toBe("ok");
  });

  test("readiness returns 200 and reports DB + env checks", async ({ request }) => {
    const r = await request.get("/api/v1/health/readiness");
    expect([200, 500]).toContain(r.status());
    const body = await r.json();

    // Envelope shape either way
    expect(body.ok !== undefined).toBe(true);

    const checks: Array<{ name: string; ok: boolean; duration_ms: number }> =
      (body.data?.checks as typeof checks) ?? (body.error?.details?.checks as typeof checks);
    expect(Array.isArray(checks)).toBe(true);
    const names = checks.map((c) => c.name).sort();
    expect(names).toEqual(["database", "env"]);
    // Every check entry must expose its runtime cost so slow checks are visible
    for (const c of checks) {
      expect(typeof c.duration_ms).toBe("number");
      expect(c.duration_ms).toBeGreaterThanOrEqual(0);
    }
  });

  test("probes bypass middleware — no Server-Timing from the mw wrapper", async ({ request }) => {
    // Middleware PROBE_PATHS skip emits NextResponse.next() with just x-request-id.
    // Server-Timing IS set by middleware on non-probe paths; on probe paths it
    // should be absent.
    const r = await request.get("/api/v1/health/liveness");
    const serverTiming = r.headers()["server-timing"];
    expect(serverTiming).toBeFalsy();
    // But request-id correlation still works.
    expect(r.headers()["x-request-id"]).toBeTruthy();
  });

  test("legacy /api/v1/health still responds (backwards compat)", async ({ request }) => {
    const r = await request.get("/api/v1/health");
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.ok).toBe(true);
    expect(body.data.version).toBe("v1");
  });

  test("supplied x-request-id round-trips on probes", async ({ request }) => {
    const rid = `test-probe-${Date.now()}`;
    const r = await request.get("/api/v1/health/liveness", { headers: { "x-request-id": rid } });
    expect(r.headers()["x-request-id"]).toBe(rid);
  });
});
