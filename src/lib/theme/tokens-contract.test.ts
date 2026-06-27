import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Token SSOT lock — v8.1 OKLCH color layer.
 *
 * The color layer in `src/app/theme/themes/atlvs-product.css` is now HAND-AUTHORED
 * in OKLCH + `light-dark()` (adopted from the ATLVS Ecosystem kit) — the legacy
 * `tokens.json → atlvs-product.css` hex generator is retired for color. This test
 * locks the new contract:
 *   1. the OKLCH brand SEED layer carries the canonical per-product accents +
 *      the four extension products, and the GHXSTSHIP house accent is ATLVS red
 *      (no green — v8.0 palette-lock);
 *   2. the `--p-*` surface/accent contract every component reads is emitted via
 *      `light-dark()` (OS-aware), for all eight products;
 *   3. `tokens.json#color` remains the sRGB reference mirror (still consumed by
 *      contrast.test.ts / brand-accent-tokens.test.ts / the cold-start guard).
 */

const CSS = readFileSync(join(process.cwd(), "src/app/theme/themes/atlvs-product.css"), "utf8");
const cssLower = CSS.toLowerCase();
const TOKENS = JSON.parse(readFileSync(join(process.cwd(), "src/app/theme/tokens.json"), "utf8")) as {
  version: string;
  color: { accent: Record<string, { light?: { accent?: string } }> };
};

const CORE_PRODUCTS = ["atlvs", "compvss", "gvteway", "legend"] as const;
const EXTENSION_PRODUCTS = ["cvrgo", "opvs", "gvlley", "vault"] as const;
const ALL_PRODUCTS = [...CORE_PRODUCTS, ...EXTENSION_PRODUCTS, "ghxstship"] as const;

describe("OKLCH color layer contract (v8.1)", () => {
  it("the brand seed layer is authored in OKLCH (not legacy hex)", () => {
    // Canonical ATLVS volcanic-red base seed — the sRGB-equal of #E23414.
    expect(CSS).toContain("--brand-atlvs:           oklch(0.5964 0.2136 32.25)");
    // The full seven-role set exists for every core product.
    for (const role of ["", "-hover", "-cta", "-text", "-on", "-lift", "-lift-text"]) {
      for (const product of CORE_PRODUCTS) {
        expect(cssLower, `--brand-${product}${role} missing from the OKLCH seed layer`).toContain(
          `--brand-${product}${role}:`,
        );
      }
    }
    // OKLCH + light-dark() architecture markers must be present.
    expect(cssLower).toContain("light-dark(");
    expect(cssLower).toContain("oklch(");
  });

  it("the four extension products own accents (CVRGO/OPVS/GVLLEY/Vault)", () => {
    for (const product of EXTENSION_PRODUCTS) {
      expect(cssLower, `extension brand --brand-${product} missing`).toContain(`--brand-${product}:`);
      expect(cssLower, `[data-product="${product}"] accent block missing`).toContain(`[data-product="${product}"]`);
    }
  });

  it("v8.0 palette-lock — GHXSTSHIP house accent is ATLVS red, NOT green", () => {
    // House aliases the ATLVS-red ramp.
    expect(CSS).toContain("--brand-ghxstship:           var(--brand-atlvs)");
    // The retired house-green hue (oklch …143.x) must never seed --brand-ghxstship.
    expect(/--brand-ghxstship:\s*oklch\([^)]*\b14[0-9](\.\d+)?\)/i.test(CSS), "retired house green must not seed ghxstship").toBe(
      false,
    );
  });

  it("every product emits the --p-accent contract via a data-product block", () => {
    const missing: string[] = [];
    for (const product of ALL_PRODUCTS) {
      const block = new RegExp(`\\[data-product="${product}"\\][^{]*\\{[^}]*--p-accent:`, "s");
      if (!block.test(CSS)) missing.push(product);
    }
    expect(missing, `products without a --p-accent block:\n${missing.join(", ")}`).toEqual([]);
  });

  it("the core surface contract resolves through light-dark()", () => {
    for (const token of ["--p-bg:", "--p-surface:", "--p-text-1:", "--p-text-3:", "--p-accent:"]) {
      const re = new RegExp(`${token.replace(/[-]/g, "\\$&")}\\s*light-dark\\(`);
      expect(re.test(CSS), `${token} should resolve via light-dark()`).toBe(true);
    }
    // OS-aware: color-scheme is declared so light-dark() resolves against the OS.
    expect(cssLower).toContain("color-scheme: light dark");
  });

  it("tokens.json remains the sRGB reference mirror for the AA + cold-start guards", () => {
    // Still stamped v8.x and still carries the per-product accent hexes the
    // contrast / brand-accent guards recompute against.
    expect(TOKENS.version.startsWith("8.")).toBe(true);
    for (const product of [...CORE_PRODUCTS, "ghxstship"] as const) {
      expect(TOKENS.color.accent[product]?.light?.accent, `tokens.json#color.accent.${product} missing`).toBeTruthy();
    }
  });
});
