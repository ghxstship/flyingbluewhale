import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * MONUMENT typography 11px floor guard (v8.0, AUDIT B-25).
 *
 * CLAUDE.md Typography: "no UI text below 11px". This test walks every
 * hand-authored TS/TSX source file and fails on any arbitrary Tailwind text
 * size under the floor — `text-[10px]`, `text-[9px]`, `text-[8px]`, … —
 * including responsive variants (`sm:text-[10px]`). Use `text-[11px]` (or the
 * canonical `.ps-caption` class for caption/metadata lines) instead.
 *
 * It also catches inline styles — `style={{ fontSize: 9 }}` / `fontSize: "10px"`
 * — which the Tailwind check can't see. Inline font sizes were the audit's
 * real gap (B-25 follow-up, 2026-07-21): the COMPVSS field kit set micro-labels
 * as low as 7.5px inline.
 *
 * Out of scope (not UI text under the floor):
 *   - test files (`*.test.*`, `__tests__/`)
 *   - print PDFs (`src/lib/pdf/**`, @react-pdf style objects)
 *   - PPTX export docs (`src/lib/pptx/**`)
 *   - OG / opengraph image routes (`src/app/og/**`, `opengraph-image` files)
 *   - SVG data-viz internals (chart axis/tick/data labels, floor plans) — small
 *     `<text>` labels are a charting convention, not UI chrome text. Scoped to
 *     the known viz files below so the exemption can't silently widen.
 *
 * Mirrors the theme guard family (spacing-grid / tokens-contract / contrast /
 * dataviz / signage).
 */
const ROOT = process.cwd();
const SRC = join(ROOT, "src");

// Any arbitrary text size from 1px to 10px — everything below the 11px floor.
const BELOW_FLOOR = /text-\[(?:[1-9]|10)px\]/;
// Inline style font sizes below 11 — `fontSize: 9`, `fontSize: "10px"`, `9.5`, …
// (a full-number capture so 12/20/24 are read whole, never a matched prefix).
const INLINE_BELOW_FLOOR = /fontSize:\s*(["']?)(\d+(?:\.\d+)?)(px)?\1/g;

const SKIP = [
  /\.test\.(ts|tsx)$/, // vitest guards / unit tests
  /(^|\/)__tests__\//, // test directories
  /^src\/lib\/pdf\//, // @react-pdf print documents
  /^src\/lib\/pptx\//, // PPTX export documents
  /^src\/app\/og\//, // OG image routes
  /opengraph/i, // opengraph-image.tsx etc.
];

// SVG data-viz files: small `<text>` labels are a charting convention, exempt
// from the inline check only (the Tailwind check still applies everywhere).
const VIZ_INLINE_SKIP = [
  /^src\/components\/charts\//,
  /^src\/components\/views\/ChartView\.tsx$/,
  /^src\/app\/\(platform\)\/studio\/finance\/reports\/ReportsCharts\.tsx$/,
  /^src\/app\/\(platform\)\/studio\/sustainability\/carbon\/CarbonCharts\.tsx$/,
  /^src\/app\/\(platform\)\/studio\/operations\/reservations\/FloorPlan\.tsx$/,
];

function isSkipped(rel: string): boolean {
  return SKIP.some((re) => re.test(rel));
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      const rel = relative(ROOT, abs).split("\\").join("/");
      if (!isSkipped(rel)) out.push(rel);
    }
  }
  return out;
}

describe("MONUMENT 11px type floor (src/**/*.{ts,tsx})", () => {
  it("no arbitrary Tailwind text size below 11px", () => {
    const offenders: string[] = [];
    for (const rel of walk(SRC)) {
      const lines = readFileSync(join(ROOT, rel), "utf8").split("\n");
      lines.forEach((line, i) => {
        if (BELOW_FLOOR.test(line)) {
          offenders.push(`${rel}:${i + 1}  ${line.trim().slice(0, 120)}`);
        }
      });
    }
    expect(
      offenders,
      `Text size below the MONUMENT 11px floor (CLAUDE.md Typography: ` +
        `"no UI text below 11px"). Use text-[11px] — or the canonical ` +
        `.ps-caption class for caption/metadata lines.\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("no inline style fontSize below 11px (outside SVG data-viz)", () => {
    const offenders: string[] = [];
    for (const rel of walk(SRC)) {
      if (VIZ_INLINE_SKIP.some((re) => re.test(rel))) continue;
      const src = readFileSync(join(ROOT, rel), "utf8");
      const lines = src.split("\n");
      lines.forEach((line, i) => {
        INLINE_BELOW_FLOOR.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = INLINE_BELOW_FLOOR.exec(line))) {
          if (parseFloat(m[2]!) < 11) {
            offenders.push(`${rel}:${i + 1}  ${line.trim().slice(0, 120)}`);
            break;
          }
        }
      });
    }
    expect(
      offenders,
      `Inline fontSize below the MONUMENT 11px floor (CLAUDE.md Typography: ` +
        `"no UI text below 11px"). Raise to 11 — or, for genuine SVG chart ` +
        `labels, add the file to VIZ_INLINE_SKIP.\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
