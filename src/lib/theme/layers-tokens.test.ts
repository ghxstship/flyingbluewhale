import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * kit-layers.css contract — guards the v8 "layers" token set (adopted from the
 * ATLVS kit tokens/layers.css): the --p-z-* z-index ladder, the --p-o-* opacity
 * scale, and the opt-in colorblind-safe chart palette ([data-chart="safe"]).
 * Keeps the layer wired + internally consistent (the ladder strictly ascending,
 * all eight chart slots remapped) so stacking order can't silently fork.
 */
const ROOT = process.cwd();
const CSS = readFileSync(join(ROOT, "src/app/theme/kit-layers.css"), "utf8");
const INDEX = readFileSync(join(ROOT, "src/app/theme/index.css"), "utf8");
const cssN = CSS.replace(/\s+/g, " ");

const Z_LADDER = ["base", "raised", "sticky", "nav", "dropdown", "overlay", "modal", "popover", "toast", "tour", "max"];
const OPACITY = ["disabled", "muted", "faint", "scrim", "scrim-dark"];

describe("kit-layers.css — stacking, opacity, accessible dataviz", () => {
  it("is imported by theme/index.css", () => {
    expect(INDEX).toContain('@import "./kit-layers.css"');
  });

  it("defines the full --p-z-* ladder", () => {
    const missing = Z_LADDER.filter((k) => !cssN.includes(`--p-z-${k}:`));
    expect(missing, `missing z-index tokens: ${missing.join(", ")}`).toEqual([]);
  });

  it("the z-index ladder is strictly increasing", () => {
    const vals = Z_LADDER.map((k) => {
      const m = cssN.match(new RegExp(`--p-z-${k}:\\s*(\\d+)`));
      return m ? Number(m[1]) : NaN;
    });
    for (let i = 1; i < vals.length; i++) {
      expect(vals[i], `--p-z-${Z_LADDER[i]} must exceed --p-z-${Z_LADDER[i - 1]}`).toBeGreaterThan(vals[i - 1]!);
    }
  });

  it("defines the --p-o-* opacity scale", () => {
    const missing = OPACITY.filter((k) => !cssN.includes(`--p-o-${k}:`));
    expect(missing, `missing opacity tokens: ${missing.join(", ")}`).toEqual([]);
  });

  it('[data-chart="safe"] remaps all 8 chart slots (oklch)', () => {
    expect(cssN).toContain('[data-chart="safe"]');
    const missing = Array.from({ length: 8 }, (_, i) => i + 1).filter((n) => !cssN.includes(`--chart-${n}: oklch`));
    expect(missing, `safe palette missing chart slots: ${missing.join(", ")}`).toEqual([]);
  });

  it("the patterned encoding defines 8 dash tokens", () => {
    expect(cssN).toContain('[data-chart="safe"][data-encode="patterned"]');
    const missing = Array.from({ length: 8 }, (_, i) => i + 1).filter((n) => !cssN.includes(`--chart-dash-${n}:`));
    expect(missing, `missing dash tokens: ${missing.join(", ")}`).toEqual([]);
  });
});
