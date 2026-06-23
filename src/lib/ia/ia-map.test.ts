import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * IA-model drift guard (ecosystem IA upgrade, ADR-0011).
 *
 * `scripts/gen-ia-map.mjs` derives `public/ia/ia-model.json` from the curated
 * nav rails (`src/lib/nav.ts`) + the `src/app` route-group tree. It is the
 * single source of truth for the LEG3ND `/legend/architecture` reference, which
 * renders entirely from it. This guard:
 *
 *  1. `--check` → asserts the committed model is regenerated and in sync (the
 *     same drift gate as `gen:sitemap:check` / `gen:theme:check`). Any nav.ts
 *     edit or route-group add/rename must be followed by `npm run gen:ia-map`.
 *  2. structural sanity → the model has the four product shells' addressing,
 *     the fixed archetype vocabulary, and a non-trivial route surface.
 */

const ROOT = process.cwd();
const SCRIPT = join(ROOT, "scripts/gen-ia-map.mjs");
const MODEL = join(ROOT, "public/ia/ia-model.json");
const run = (...args: string[]) => execFileSync("node", [SCRIPT, ...args], { cwd: ROOT, encoding: "utf8" });

type Model = {
  meta: { addressing: string };
  archetypes: Record<string, { name: string; components: string[] }>;
  newComponents: string[];
  shells: { id: string; host: string; routeGroup: string; groups: { label: string; routes: { path: string; arch: string[] }[] }[] }[];
};

describe("IA model (ia-model.json)", () => {
  const model = JSON.parse(readFileSync(MODEL, "utf8")) as Model;

  it("public/ia/ia-model.json is regenerated and in sync", () => {
    expect(() => run("--check")).not.toThrow();
  });

  it("carries the fixed archetype vocabulary", () => {
    for (const key of ["SHELL", "DASH", "LIST", "REC", "FORM", "RPT", "DOC", "LMS", "FIELD", "SET"]) {
      expect(model.archetypes[key], `missing archetype ${key}`).toBeTruthy();
    }
  });

  it("emits the operator + field + portal shells with real-word subdomain addressing", () => {
    const byId = Object.fromEntries(model.shells.map((s) => [s.id, s]));
    expect(byId.atlvs?.host).toBe("app.atlvs.pro");
    expect(byId.compvss?.host).toBe("compass.atlvs.pro");
    expect(byId.gvteway?.host).toBe("gateway.atlvs.pro");
    // No production URL doubles the route-group prefix into the host path.
    for (const s of model.shells) {
      for (const g of s.groups) {
        for (const r of g.routes) expect(r.arch.length, `${r.path} has no archetype`).toBeGreaterThan(0);
      }
    }
  });

  it("inventories a non-trivial route surface", () => {
    const routes = model.shells.reduce((n, s) => n + s.groups.reduce((m, g) => m + g.routes.length, 0), 0);
    expect(routes).toBeGreaterThan(100);
  });
}, 60_000);
