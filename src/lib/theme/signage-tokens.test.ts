import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PICTOGRAMS, PICTOGRAM_IDS, isPictogramId } from "@/lib/signage_pictograms";
import { CATEGORY_FALLBACK_SYMBOL, CATEGORY_TONE, SIGNAGE_CATEGORIES, SIGN_TONES } from "@/lib/legend_signage";

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

/**
 * AIGA-only sweep — the legacy house `p-*` pictograms are retired; the library
 * is exclusively the public-domain AIGA / U.S. DOT set, and every sign colors
 * from its category's airport tone via the `--sign-*` tokens.
 */
describe("signage library — AIGA/DOT only", () => {
  const SPRITE = readFileSync(join(ROOT, "public/brand/pictograms.svg"), "utf8");

  it("the sprite is well-formed XML — no '--' inside a comment (would break external <use>)", () => {
    // External `<use href="sprite.svg#id">` requires the sprite to be valid
    // XML; a `--` inside a comment is illegal and makes every glyph fail to
    // render (the HTML parser tolerates it, so it slips past inline previews).
    const commentBodies = [...SPRITE.matchAll(/<!--([\s\S]*?)-->/g)].map((m) => m[1] ?? "");
    for (const body of commentBodies) {
      expect(body.includes("--"), `sprite comment contains illegal '--': ${body.trim().slice(0, 70)}`).toBe(false);
    }
  });

  it("the sprite is strictly two-color — only currentColor + --sign-knock, no raw hex", () => {
    // Two-color rule: POSITIVE = currentColor (legend), NEGATIVE = --sign-knock
    // (field). No baked #000/#fff would survive theming or the field reveal.
    const fills = [...SPRITE.matchAll(/(?:fill|stroke)="([^"]+)"/g)].map((m) => m[1] ?? "");
    const offenders = fills.filter((v) => /#[0-9a-f]{3,6}/i.test(v) && !v.includes("var(--sign-knock"));
    expect(offenders, `sprite has raw hex fills (breaks the two-color rule):\n${offenders.join("\n")}`).toEqual([]);
    expect(SPRITE).toContain("var(--sign-knock");
  });

  it("the sprite contains ZERO legacy p-* symbols and only aiga-* ids", () => {
    const ids = [...SPRITE.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1] ?? "");
    expect(ids.length).toBe(60);
    expect(ids.filter((id) => !id.startsWith("aiga-"))).toEqual([]);
    expect(SPRITE).not.toMatch(/id="p-/);
  });

  it("the registry is AIGA-only and matches the sprite", () => {
    const spriteIds = new Set([...SPRITE.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1] ?? ""));
    expect(PICTOGRAMS.length).toBe(60);
    for (const p of PICTOGRAMS) {
      expect(p.id.startsWith("aiga-"), `non-AIGA registry id: ${p.id}`).toBe(true);
      expect(spriteIds.has(p.id), `registry id ${p.id} missing from sprite`).toBe(true);
    }
    // sprite ↔ registry are the same set
    expect([...spriteIds].sort()).toEqual([...PICTOGRAM_IDS].sort());
  });

  it("every category fallback resolves to a real AIGA pictogram", () => {
    for (const cat of SIGNAGE_CATEGORIES) {
      const id = CATEGORY_FALLBACK_SYMBOL[cat]!;
      expect(id.startsWith("aiga-"), `${cat} fallback not AIGA: ${id}`).toBe(true);
      expect(isPictogramId(id), `${cat} fallback ${id} not in registry`).toBe(true);
    }
  });

  it("every category maps to a canonical airport tone with field+legend tokens", () => {
    for (const cat of SIGNAGE_CATEGORIES) {
      const tone = CATEGORY_TONE[cat]!;
      expect((SIGN_TONES as readonly string[]).includes(tone), `${cat} → unknown tone ${tone}`).toBe(true);
      // the tone's field/legend tokens exist in the CSS layer
      expect(cssN).toContain(`--sign-${tone}-field:`);
      expect(cssN).toContain(`--sign-${tone}-legend:`);
    }
  });
});
