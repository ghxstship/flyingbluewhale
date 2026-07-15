import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { QUEUEABLE_ENDPOINTS } from "./outbox";

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
