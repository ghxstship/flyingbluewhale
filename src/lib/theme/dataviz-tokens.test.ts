import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Breakpoint + data-viz token contract — guards that tokens.json#breakpoints
 * and tokens.json#chart can't fork from their hand-authored implementation in
 * atlvs-product.css (the generator only emits brand/surface/accent, so these
 * `--bp-*` / `--chart-*` layers are hand-authored like spacing/motion).
 */
const ROOT = process.cwd();
const TOKENS = JSON.parse(readFileSync(join(ROOT, "src/app/theme/tokens.json"), "utf8"));
const CSS = readFileSync(join(ROOT, "src/app/theme/themes/atlvs-product.css"), "utf8");
const cssN = CSS.replace(/\s+/g, " ");

describe("breakpoint tokens (tokens.json ↔ atlvs-product.css)", () => {
  it("every breakpoint is authored verbatim in the theme", () => {
    const bp = TOKENS.breakpoints as Record<string, string>;
    const missing: string[] = [];
    for (const [name, value] of Object.entries(bp)) {
      if (name === "_note") continue;
      const cssVar = name === "content-max" ? "--p-content-max" : `--${name}`;
      if (!cssN.includes(`${cssVar}: ${value};`)) missing.push(`${cssVar}: ${value}`);
    }
    expect(missing, `Breakpoint(s) missing/forked in atlvs-product.css:\n${missing.join("\n")}`).toEqual([]);
  });
});

/**
 * Kit-29: the CSS chart ramp is authored in OKLCH (P3-ready); tokens.json#chart
 * stays the sRGB reference mirror. This table is the certified hex ⇄ OKLCH
 * equivalence (exact conversions, zero visual change on sRGB) — if either side
 * changes independently, the lookup misses and the test fails.
 */
const CHART_OKLCH: Record<string, string> = {
  "#2563eb": "oklch(0.5461 0.2152 262.88)",
  "#e8500a": "oklch(0.6334 0.199 39.09)",
  "#1f8a5b": "oklch(0.563 0.1191 158.94)",
  "#f0b255": "oklch(0.804 0.1307 74.97)",
  "#8b5cf6": "oklch(0.6056 0.2189 292.72)",
  "#ec4899": "oklch(0.6559 0.2118 354.31)",
  "#14b8a6": "oklch(0.7038 0.123 182.5)",
  "#64748b": "oklch(0.5544 0.0407 257.42)",
};

describe("data-viz chart ramp (tokens.json ↔ atlvs-product.css)", () => {
  it("all 8 series colors are authored as the certified OKLCH equivalents of the sRGB mirror", () => {
    const series = TOKENS.chart.series as Record<string, string>;
    const missing: string[] = [];
    for (const [name, value] of Object.entries(series)) {
      const oklch = CHART_OKLCH[value.toLowerCase()];
      if (!oklch) {
        missing.push(`--${name}: ${value} has no certified OKLCH equivalent — update CHART_OKLCH`);
        continue;
      }
      if (!cssN.includes(`--${name}: ${oklch};`)) missing.push(`--${name}: ${oklch}`);
    }
    expect(missing, `Chart series missing/forked in atlvs-product.css:\n${missing.join("\n")}`).toEqual([]);
  });

  it("the chart chrome tokens (grid/axis/label) are present", () => {
    for (const name of Object.keys(TOKENS.chart.chrome)) {
      expect(cssN, `theme missing --${name}`).toContain(`--${name}:`);
    }
  });

  it("the series ramp is 8 distinct colors", () => {
    const vals = Object.values(TOKENS.chart.series as Record<string, string>);
    expect(vals.length).toBe(8);
    expect(new Set(vals).size).toBe(8);
  });
});
