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

describe("data-viz chart ramp (tokens.json ↔ atlvs-product.css)", () => {
  it("all 8 series colors are authored verbatim in the theme", () => {
    const series = TOKENS.chart.series as Record<string, string>;
    const missing: string[] = [];
    for (const [name, value] of Object.entries(series)) {
      if (!cssN.includes(`--${name}: ${value};`)) missing.push(`--${name}: ${value}`);
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
