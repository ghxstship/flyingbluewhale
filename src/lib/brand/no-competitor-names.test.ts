import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Brand hygiene guard. The voice canon forbids comparing to competitors, so
 * third-party app names that are NOT integrations must not appear in product
 * code. (Integration connectors live in the integrations marketplace and are
 * exempt; this guard scans application code only.) Distinctive brand tokens
 * only — generic words like "deputy"/"sling" would false-positive.
 *
 * RATIFIED CARVE-OUT (marketing rebuild plan §12.1, 2026-07-22): the
 * bottom-of-funnel comparison surfaces (/compare, /alternatives) may name
 * competitors. Their entries live in JSON data files
 * (src/lib/marketing/comparisons-*.json) which this guard deliberately does
 * not scan (.ts/.tsx only) — that is the designed boundary, not a loophole:
 * names stay out of application CODE and live only in comparison DATA
 * consumed by those two templates. comparison-verification.test.ts enforces
 * the honesty discipline (lastVerified + sources) on every such entry.
 */
const FORBIDDEN = ["connecteam", "growthbook", "beatgig", "skool"];

const SELF = "no-competitor-names.test.ts";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry) && entry !== SELF) out.push(full);
  }
  return out;
}

describe("brand hygiene — no competitor app names in product code", () => {
  it("contains none of the forbidden competitor brand tokens under src/", () => {
    const offenders: string[] = [];
    for (const file of walk(join(process.cwd(), "src"))) {
      const text = readFileSync(file, "utf8").toLowerCase();
      for (const name of FORBIDDEN) {
        if (text.includes(name)) offenders.push(`${file} → "${name}"`);
      }
    }
    expect(offenders, `Competitor brand names found:\n${offenders.join("\n")}`).toEqual([]);
  });
});
