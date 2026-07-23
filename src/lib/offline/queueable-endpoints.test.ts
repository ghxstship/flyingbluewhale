import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { QUEUEABLE_ENDPOINTS } from "./outbox";
import { EMERGENCY_ROUTES } from "./emergency-routes";

/**
 * The offline queue's endpoint allow-list exists twice by necessity: the
 * service worker is plain JS loaded by the browser at /service-worker.js
 * and cannot import from `src/`, so `public/service-worker.js` carries its
 * own literal. Only a comment ("Keep in sync with...") bound the two.
 *
 * The failure mode is silent and asymmetric, which is why it needs a test:
 * the SW's list is the one that actually intercepts fetches, while
 * `outbox.ts`'s list only widens the `QueueableEndpoint` type. Add a path
 * to `outbox.ts` alone and it type-checks, ships, and simply never queues —
 * offline punches are lost with no error anywhere.
 */
describe("QUEUEABLE_ENDPOINTS parity", () => {
  const sw = readFileSync(join(process.cwd(), "public/service-worker.js"), "utf8");

  /**
   * Parse the SW's list, resolving the `PUNCH_ENDPOINT` / `CLOCK_ENDPOINT`
   * consts it references by name rather than by literal.
   */
  function swQueueableEndpoints(): string[] {
    const block = sw.match(/const QUEUEABLE_ENDPOINTS = \[([\s\S]*?)\]/);
    if (!block?.[1]) throw new Error("Could not find QUEUEABLE_ENDPOINTS in public/service-worker.js");

    const consts = new Map<string, string>();
    for (const match of sw.matchAll(/const (\w+_ENDPOINT) = "([^"]+)"/g)) {
      const [, name, value] = match;
      if (name && value) consts.set(name, value);
    }

    return block[1]
      .split(",")
      .map((entry) => entry.replace(/\/\/.*$/gm, "").trim())
      .filter(Boolean)
      .map((entry) => {
        const literal = entry.match(/^"([^"]+)"$/);
        if (literal?.[1]) return literal[1];
        const resolved = consts.get(entry);
        if (!resolved) throw new Error(`Unresolvable entry in SW QUEUEABLE_ENDPOINTS: ${entry}`);
        return resolved;
      });
  }

  it("matches the list the service worker actually intercepts", () => {
    expect([...swQueueableEndpoints()].sort()).toEqual([...QUEUEABLE_ENDPOINTS].sort());
  });

  it("queues every endpoint exactly once", () => {
    const fromSw = swQueueableEndpoints();
    expect(new Set(fromSw).size).toBe(fromSw.length);
    expect(new Set(QUEUEABLE_ENDPOINTS).size).toBe(QUEUEABLE_ENDPOINTS.length);
  });

  it("only queues /api/v1 write endpoints", () => {
    for (const endpoint of QUEUEABLE_ENDPOINTS) {
      expect(endpoint).toMatch(/^\/api\/v1\//);
    }
  });
});

/**
 * Emergency offline tier (M0-b F3) — same dual-list necessity as above: the
 * SW carries its own EMERGENCY_ROUTES literal, `emergency-routes.ts` is the
 * app-side mirror. The failure mode this ratchet closes: drop the tier (or a
 * route) from the SW and evac/crisis codes silently stop being guaranteed
 * offline — nothing else would notice.
 */
describe("emergency offline tier", () => {
  const sw = readFileSync(join(process.cwd(), "public/service-worker.js"), "utf8");

  function swEmergencyRoutes(): string[] {
    const block = sw.match(/const EMERGENCY_ROUTES = \[([\s\S]*?)\]/);
    if (!block?.[1]) throw new Error("Could not find EMERGENCY_ROUTES in public/service-worker.js");
    const routes = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1] as string);
    // Guard the parsing guard — a regex matching nothing must fail loudly,
    // not pass every assertion vacuously.
    if (routes.length === 0) throw new Error("Parsed zero EMERGENCY_ROUTES from the SW");
    return routes;
  }

  it("mirrors src/lib/offline/emergency-routes.ts exactly", () => {
    expect([...swEmergencyRoutes()].sort()).toEqual([...EMERGENCY_ROUTES].sort());
  });

  it("keeps the emergency hub and its four reference pages in the tier", () => {
    for (const route of [
      "/m/emergency",
      "/m/emergency/codes",
      "/m/emergency/fire",
      "/m/emergency/evacuation",
      "/m/emergency/shelter",
    ]) {
      expect(EMERGENCY_ROUTES).toContain(route);
    }
  });

  it("declares a dedicated emergency cache and preserves it on activate", () => {
    // A dedicated cache name is what exempts the tier from the runtime FIFO
    // trim; the activate keep-list is what stops an upgrade from deleting it.
    expect(sw).toMatch(/const EMERGENCY_CACHE = `atlvs-emergency-\$\{VERSION\}`/);
    expect(sw).toContain("k !== EMERGENCY_CACHE");
  });

  it("serves the tier from the emergency cache on network failure", () => {
    // The fetch handler must consult EMERGENCY_ROUTES and fall back to the
    // dedicated cache — the precache CANNOT hold these pages (auth-gated;
    // install-time capture would cache a login redirect).
    expect(sw).toMatch(/EMERGENCY_ROUTES\.includes\(url\.pathname\)/);
    expect(sw).toMatch(/caches\.open\(EMERGENCY_CACHE\)/);
  });

  it("ships as SW version v8 or later (the version that introduced the tier)", () => {
    const version = sw.match(/const VERSION = "v(\d+)"/);
    expect(version?.[1], "SW VERSION constant not found").toBeTruthy();
    expect(Number(version?.[1])).toBeGreaterThanOrEqual(8);
  });
});
