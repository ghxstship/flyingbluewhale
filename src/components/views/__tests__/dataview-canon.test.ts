import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * B-final ratchet (Option B, ratified 2026-07-22): `views/DataView` is the
 * ONE canonical collection surface. The legacy `@/components/DataTable`
 * server wrapper was deleted after all 268 call sites migrated; this guard
 * keeps it deleted and keeps new code from re-coining a parallel collection
 * vocabulary. `DataTableInteractive` remains the shared client engine that
 * DataView composes — importing IT outside the views layer is the ratchet's
 * second hole to close (grandfathered consumers pinned below).
 */

const ROOT = join(__dirname, "..", "..", "..", "..");
const SRC = join(ROOT, "src");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.|\.spec\./.test(name)) out.push(p);
  }
  return out;
}

describe("DataView canon (B-final ratchet)", () => {
  const files = walk(SRC);

  it("the legacy DataTable server wrapper stays deleted", () => {
    expect(existsSync(join(SRC, "components", "DataTable.tsx"))).toBe(false);
  });

  it("no code imports the deleted @/components/DataTable module", () => {
    // Anchored to statement position so docblock migration examples
    // (DataViewServer's recipe header) don't count as imports.
    const offenders = files.filter((f) =>
      /^\s*(import|export)[^\n]*from\s+["']@\/components\/DataTable["']/m.test(readFileSync(f, "utf8")),
    );
    expect(offenders.map((f) => f.slice(ROOT.length + 1))).toEqual([]);
  });

  it("DataTableInteractive is composed only through the views layer (pinned)", () => {
    // The client engine belongs to DataView. Direct consumers outside
    // src/components/views are grandfathered here and may only shrink.
    const GRANDFATHERED = new Set<string>([]);
    const offenders = files
      .filter((f) => !f.includes(join("components", "views")))
      .filter((f) => /from\s+["']@\/components\/DataTableInteractive["']/.test(readFileSync(f, "utf8")))
      .map((f) => f.slice(ROOT.length + 1))
      .filter((f) => !GRANDFATHERED.has(f));
    expect(offenders).toEqual([]);
  });
});
