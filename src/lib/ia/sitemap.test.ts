import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

/**
 * Sitemap reconciliation ratchet (sitemap reconciliation, 2026-06-17).
 *
 * `scripts/generate-sitemap.mjs` reconciles the filesystem (`src/app/**\/page.tsx`)
 * against the navigation IA (`src/lib/nav.ts`). This guard runs it in two modes
 * and fails CI on any regression:
 *
 *  1. `--json` → assert the reconciliation counts stay at zero. A new route that
 *     isn't wired into nav (or recorded in the generator's `EXEMPT` list with a
 *     reason) reappears as an orphan and trips this. A nav href pointing at a
 *     missing page trips `dangling`. A COMPVSS priority ref with no registered
 *     `mobileSurfaces` entry trips `deadPriority`.
 *  2. `--check` → assert the committed `docs/ia/SITEMAP.md` is regenerated and
 *     in sync (the same drift gate as `gen:theme:check`).
 *
 * To clear a legitimately non-nav route, add it to `EXEMPT` in the generator —
 * never weaken this test.
 */

const ROOT = process.cwd();
const SCRIPT = join(ROOT, "scripts/generate-sitemap.mjs");
const run = (...args: string[]) => execFileSync("node", [SCRIPT, ...args], { cwd: ROOT, encoding: "utf8" });

describe("sitemap reconciliation", () => {
  const summary = JSON.parse(run("--json")) as {
    pages: number;
    orphan: number;
    orphanModules: number;
    dangling: number;
    deadPriority: number;
  };

  it("has zero orphan routes (every page reachable from nav or EXEMPT)", () => {
    expect(summary.orphan).toBe(0);
    expect(summary.orphanModules).toBe(0);
  });

  it("has zero dangling nav hrefs (every nav link resolves to a page)", () => {
    expect(summary.dangling).toBe(0);
  });

  it("has zero unresolved COMPVSS priority refs", () => {
    expect(summary.deadPriority).toBe(0);
  });

  it("still inventories the full route surface (sanity floor)", () => {
    expect(summary.pages).toBeGreaterThan(1000);
  });

  it("docs/ia/SITEMAP.md is regenerated and in sync", () => {
    expect(() => run("--check")).not.toThrow();
  });
}, 60_000);
