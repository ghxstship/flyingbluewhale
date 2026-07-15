import { describe, expect, it } from "vitest";
import "./all-endpoints";
import { endpointRegistry } from "./registry";

/**
 * The SERVED spec had no guard at all.
 *
 * `docs/api/openapi.yaml` is drift-tested against the filesystem
 * (openapi-drift.test.ts), but `/api/v1/openapi.json` — the
 * machine-readable document an integrator actually fetches — is a route
 * handler built from this registry, and nothing compared the two. The
 * registry carried 22 endpoints while the YAML documented the full
 * surface, so a third party reading the served spec saw no time, no
 * payroll, and no timesheets at all, and had nothing to build a connector
 * against. "Documented" meant "documented in a file integrators don't
 * fetch."
 *
 * This doesn't demand parity with the whole YAML (the registry is a
 * curated subset by design). It demands that what IS served is real,
 * coherent, and covers the surface we tell people to integrate with.
 */
describe("served OpenAPI spec (/api/v1/openapi.json)", () => {
  it("registers each (method, path) exactly once", () => {
    const keys = endpointRegistry.map((e) => `${e.method} ${e.path}`);
    expect(new Set(keys).size, `duplicates: ${keys.filter((k, i) => keys.indexOf(k) !== i).join(", ")}`).toBe(
      keys.length,
    );
  });

  it("gives every endpoint a summary and at least one response", () => {
    for (const e of endpointRegistry) {
      const id = `${e.method} ${e.path}`;
      expect(e.summary, `${id} needs a summary`).toBeTruthy();
      expect(Object.keys(e.responses ?? {}).length, `${id} needs a response`).toBeGreaterThan(0);
    }
  });

  it("documents an auth failure on every authenticated endpoint", () => {
    for (const e of endpointRegistry) {
      if (e.auth === "none") continue;
      expect(Object.keys(e.responses ?? {}), `${e.method} ${e.path} should document a 401`).toContain("401");
    }
  });

  it("uses a leading slash and no /api/v1 prefix (the server adds it)", () => {
    for (const e of endpointRegistry) {
      expect(e.path.startsWith("/"), `${e.path} needs a leading slash`).toBe(true);
      expect(e.path.startsWith("/api/"), `${e.path} must not repeat the base path`).toBe(false);
    }
  });

  /**
   * The rule from TIME_MANAGEMENT_LIFECYCLE_PLAN.md §5.5: anything a native
   * connector can do, an outside integrator must be able to do through the
   * public surface. That is only true if the surface is actually published
   * in the document they fetch.
   */
  it("publishes the time surface a payroll connector needs", () => {
    const served = new Set(endpointRegistry.map((e) => `${e.method} ${e.path}`));
    for (const required of [
      "POST /time/clock",
      "GET /time/corrections",
      "POST /time/corrections",
      "PATCH /time/corrections/{id}",
      "POST /timesheets/{id}/submit",
    ]) {
      expect(served, `${required} must be in the served spec`).toContain(required);
    }
  });

  it("tells a 422 geofence refusal apart from a 409 duplicate on the punch endpoint", () => {
    const clock = endpointRegistry.find((e) => e.method === "POST" && e.path === "/time/clock");
    expect(clock).toBeTruthy();
    const codes = Object.keys(clock?.responses ?? {});
    // The distinction is load-bearing: the offline outbox drops 409
    // terminally as a dedupe, so a policy refusal must not share it.
    expect(codes).toContain("422");
    expect(codes).toContain("409");
  });
});
