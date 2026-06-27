import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Component status taxonomy guard (design-system inventory §Guidelines).
 *
 * `src/app/theme/component-maturity.json` is the SSOT for every `ui/` primitive's
 * stability level (stable / beta / deprecated). This test keeps it honest:
 *   1. every `src/components/ui/*.tsx` (a real component) has a registry entry,
 *   2. every registry entry resolves to a real component file,
 *   3. every status is one of the allowed levels.
 * So the taxonomy can never silently drift from the shipped component set.
 */
const ROOT = process.cwd();
const REGISTRY = JSON.parse(
  readFileSync(join(ROOT, "src/app/theme/component-maturity.json"), "utf8"),
) as { levels: Record<string, string>; components: Record<string, string> };

const UI_DIR = join(ROOT, "src/components/ui");
const componentFiles = readdirSync(UI_DIR)
  .filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"))
  .map((f) => f.replace(/\.tsx$/, ""));

describe("component maturity registry (taxonomy ↔ ui/)", () => {
  it("every ui/ component has a maturity entry", () => {
    const missing = componentFiles.filter((c) => !(c in REGISTRY.components));
    expect(missing, `ui components missing from component-maturity.json:\n${missing.join("\n")}`).toEqual([]);
  });

  it("every maturity entry resolves to a real ui/ component file", () => {
    const orphans = Object.keys(REGISTRY.components).filter((c) => !componentFiles.includes(c));
    expect(orphans, `registry entries with no component file:\n${orphans.join("\n")}`).toEqual([]);
  });

  it("every status is an allowed level", () => {
    const allowed = new Set(Object.keys(REGISTRY.levels));
    const bad = Object.entries(REGISTRY.components).filter(([, s]) => !allowed.has(s));
    expect(bad, `entries with an invalid status:\n${bad.map(([c, s]) => `${c}=${s}`).join("\n")}`).toEqual([]);
  });
});
