import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Cold-start fallback drift guard (THM-4).
 *
 * The SSR cold-start `:root` blocks in `globals.css` and `theme/index.css`
 * hardcode accent + background hexes (the GHXSTSHIP house-green default) so the
 * un-attributed pre-paint flash matches the canonical kit surface. The theme
 * generator only emits the brand/surface/accent layers under `[data-platform]`
 * scopes, so these fallback literals are NOT machine-checked by the
 * tokens-contract test — and can silently drift from the SSOT.
 *
 * This asserts every `--p-accent*` / `--p-bg` hex in those two cold-start blocks
 * appears among the string values of `tokens.json` (case-insensitive).
 */
const ROOT = process.cwd();
const TOKENS = JSON.parse(readFileSync(join(ROOT, "src/app/theme/tokens.json"), "utf8")) as unknown;

/** Recursively collect every string leaf value, lower-cased. */
function collectStrings(node: unknown, acc: Set<string>): Set<string> {
  if (typeof node === "string") {
    acc.add(node.toLowerCase());
  } else if (Array.isArray(node)) {
    for (const item of node) collectStrings(item, acc);
  } else if (node && typeof node === "object") {
    for (const v of Object.values(node)) collectStrings(v, acc);
  }
  return acc;
}
const TOKEN_VALUES = collectStrings(TOKENS, new Set<string>());

/** Pull `--p-accent*` / `--p-bg` hex values from a CSS file's :root block(s). */
function extractFallbackHexes(file: string): Array<{ prop: string; hex: string }> {
  const css = readFileSync(join(ROOT, file), "utf8");
  const out: Array<{ prop: string; hex: string }> = [];
  // Match `--p-accent...: #rrggbb;` and `--p-bg: #rrggbb;` declarations.
  const re = /(--p-(?:accent[\w-]*|bg))\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    const prop = m[1];
    const hex = m[2];
    if (prop && hex) out.push({ prop, hex });
  }
  return out;
}

const SOURCES = ["src/app/globals.css", "src/app/theme/index.css"];

describe("cold-start fallback accents are contained in tokens.json", () => {
  for (const file of SOURCES) {
    it(`${file} fallback hexes all appear in tokens.json values`, () => {
      const hexes = extractFallbackHexes(file);
      // Sanity: the block must actually carry fallback accents.
      expect(hexes.length, `No --p-accent*/--p-bg hex fallbacks found in ${file}`).toBeGreaterThan(0);
      const orphans = hexes.filter(({ hex }) => !TOKEN_VALUES.has(hex.toLowerCase()));
      expect(
        orphans,
        `Fallback hex(es) in ${file} not found among tokens.json values:\n${orphans
          .map(({ prop, hex }) => `${prop}: ${hex}`)
          .join("\n")}`,
      ).toEqual([]);
    });
  }
});

/**
 * GH-3 (lane-F, W1 2026-07-22) — mirror containment for the sanctioned
 * raw-hex surfaces that can't consume CSS variables. The email kit palette
 * (email clients strip <style> and can't read var()) and the social/OG card
 * inks inline literal hexes by necessity — but every one of those literals
 * MUST exist among tokens.json's string values, or the mirror has silently
 * forked from the SSOT (exactly what happened to email accentHover +
 * surfaceInset before W1 re-seeded them).
 */
const MIRROR_SOURCES = ["src/components/email/blocks.ts", "src/components/social/SocialCard.tsx"];

describe("email/social palette mirrors are contained in tokens.json (GH-3)", () => {
  for (const file of MIRROR_SOURCES) {
    it(`${file} hex literals all appear in tokens.json values`, () => {
      // Strip comments so prose hex mentions don't count; scan string-literal hexes.
      const src = readFileSync(join(ROOT, file), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      const hexes = [...src.matchAll(/["'`](#[0-9a-fA-F]{3,8})["'`]/g)].map((m) => m[1]!);
      expect(hexes.length, `No hex literals found in ${file} — has the mirror moved?`).toBeGreaterThan(0);
      const orphans = [...new Set(hexes)].filter((h) => !TOKEN_VALUES.has(h.toLowerCase()));
      expect(
        orphans,
        `Hex literal(s) in ${file} not found among tokens.json values — the mirror drifted from the SSOT. ` +
          `Re-seed to the canonical value (or, if canon changed, update the mirror):\n${orphans.join("\n")}`,
      ).toEqual([]);
    });
  }
});
