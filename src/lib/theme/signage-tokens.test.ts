import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Signage token contract — guards that the LEG3ND wayfinding SSOT in
 * `tokens.json#signage` and its implementation in `kit-signage.css` can't fork
 * (the signage analogue of tokens-contract.test.ts). The generator
 * (gen-theme-tokens.mjs) only emits brand/surface/accent, so the `--sign-*`
 * layer is hand-authored — this test is what keeps it honest.
 */
const ROOT = process.cwd();
const TOKENS = JSON.parse(readFileSync(join(ROOT, "src/app/theme/tokens.json"), "utf8"));
const CSS = readFileSync(join(ROOT, "src/app/theme/kit-signage.css"), "utf8");
// Strip /* … */ comments so policy prose (which names the banned faces to
// explain why they're absent) never counts as actual usage.
const CSS_CODE = CSS.replace(/\/\*[\s\S]*?\*\//g, "");
const norm = (s: string) => s.replace(/\s+/g, " ");
const cssN = norm(CSS);

describe("signage token contract (tokens.json ↔ kit-signage.css)", () => {
  it("every seed in tokens.json#signage.seeds is authored verbatim in kit-signage.css", () => {
    const seeds = TOKENS.signage.seeds as Record<string, string>;
    const missing: string[] = [];
    for (const [name, value] of Object.entries(seeds)) {
      if (name === "_note") continue;
      if (!cssN.includes(`--${name}: ${value};`)) missing.push(`--${name}: ${value}`);
    }
    expect(missing, `Seed(s) missing/forked in kit-signage.css:\n${missing.join("\n")}`).toEqual([]);
  });

  it("every airport function maps to field + legend tokens in the CSS", () => {
    const fns = TOKENS.signage.functionMap as Record<string, unknown>;
    const missing: string[] = [];
    for (const fn of Object.keys(fns)) {
      if (fn === "_note") continue;
      for (const role of ["field", "legend"]) {
        if (!cssN.includes(`--sign-${fn}-${role}:`)) missing.push(`--sign-${fn}-${role}`);
      }
    }
    expect(missing, `Function-map token(s) missing in kit-signage.css:\n${missing.join("\n")}`).toEqual([]);
  });

  it("the legend type face does NOT redistribute the licensed Frutiger/Airport face", () => {
    // License canon: the airport face degrades to the data-type=legend fallback
    // until a licensed face is mounted via @font-face in /fonts.
    expect(TOKENS.signage.typography.font).not.toMatch(/frutiger|airport/i);
    expect(CSS_CODE).not.toMatch(/@font-face|frutiger|\.ttf/i);
  });

  it("the legibility scale (sm·md·lg·xl) is present in both SSOT and CSS", () => {
    for (const tier of ["sm", "md", "lg", "xl"]) {
      expect(TOKENS.signage.legibility[tier], `tokens.json missing legibility.${tier}`).toBeTruthy();
      expect(cssN, `kit-signage.css missing --sign-cap-${tier}-px`).toContain(`--sign-cap-${tier}-px:`);
    }
  });
});
