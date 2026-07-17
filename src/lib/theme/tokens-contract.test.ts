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
  color: {
    neutral: Record<"light" | "dark", Record<string, string>>;
    surface: Record<"light" | "dark", Record<string, string>>;
    accent: Record<string, Record<"light" | "dark", Record<string, string>>>;
  };
  spacing: Record<string, string>;
  density: Record<string, Record<string, string>>;
};

const CORE_PRODUCTS = ["atlvs", "compvss", "gvteway", "legend"] as const;
const EXTENSION_PRODUCTS = ["cvrgo", "opvs", "gvlley", "vault"] as const;
const ALL_PRODUCTS = [...CORE_PRODUCTS, ...EXTENSION_PRODUCTS] as const;

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

  it("ratified 2026-07-17 — there is NO GHXSTSHIP theme (identity mark only)", () => {
    // Two theming systems only: ATLVS Ecosystem default + Full System
    // Whitelabel. No --brand-ghxstship* seeds, no product/platform scopes —
    // house surfaces resolve to the ATLVS cold-start default.
    expect(cssLower).not.toContain("--brand-ghxstship");
    expect(cssLower).not.toContain('[data-product="ghxstship"]');
    expect(cssLower).not.toContain('[data-platform="ghxstship"]');
  });

  it("every product emits the --p-accent contract via a data-product block", () => {
    const missing: string[] = [];
    for (const product of ALL_PRODUCTS) {
      const block = new RegExp(`\\[data-product="${product}"\\][^{]*\\{[^}]*--p-accent:`, "s");
      if (!block.test(CSS)) missing.push(product);
    }
    expect(missing, `products without a --p-accent block:\n${missing.join(", ")}`).toEqual([]);
  });

  it("kit-29 — the accent ramp is the DS v7.3 hue-locked recipe", () => {
    // Tints mix in OKLCH toward a HUE-STRIPPED surface target so warm accents
    // can't rotate through the tints; 600 ≡ hover; shades mix in OKLAB.
    expect(cssLower).toContain(
      "--p-accent-50: color-mix(in oklch, var(--k-acc, var(--p-accent)) 8%, oklch(from var(--p-surface) l 0 none))",
    );
    expect(cssLower).toContain(
      "--p-accent-400: color-mix(in oklch, var(--k-acc, var(--p-accent)) 70%, oklch(from var(--p-surface) l 0 none))",
    );
    expect(cssLower).toContain("--p-accent-600: var(--p-accent-hover,");
    expect(cssLower).toContain("--p-accent-900: color-mix(in oklab, var(--k-acc, var(--p-accent)) 46%, var(--p-text-1))");
    // The superseded drifting recipe (oklab tints toward the un-stripped
    // surface) must not linger.
    expect(cssLower).not.toContain("--p-accent-50: color-mix(in oklab,");
  });

  it("kit-29 — the elevation scale is the DS recipe (light + dark)", () => {
    expect(cssLower).toContain("--p-elev-xs: 0 1px 1px rgba(16, 20, 30, 0.04)");
    expect(cssLower).toContain("--p-elev-3: 0 4px 8px rgba(16, 20, 30, 0.06), 0 16px 32px rgba(16, 20, 30, 0.14)");
    expect(cssLower).toContain("--p-elev-2xl: 0 8px 16px rgba(16, 20, 30, 0.08), 0 32px 56px rgba(16, 20, 30, 0.18)");
    // Dark recipe (both the data-mode scope and the OS-dark mirror carry it).
    const darkElev3 = "--p-elev-3: 0 12px 36px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06)";
    expect(cssLower.split(darkElev3).length - 1).toBeGreaterThanOrEqual(2);
  });

  it("kit-29 — no literal shadows a token (--p-ease, chart OKLCH, avatar → identity seeds)", () => {
    expect(cssLower).toContain("--p-ease: var(--motion-hover) var(--ease-hover)");
    expect(cssLower).toContain("--chart-1: oklch(");
    expect(cssLower).toContain("--p-avatar-1: var(--identity-1)");
    // Semantic-text inks resolve through ONE light-dark() layer over seeds.
    expect(cssLower).toContain("--p-success-text: light-dark(var(--sem-success-text), var(--sem-success-text-dark))");
  });

  it("kit-29 — corner canon: containers (.ps-card/.ps-table) ride --p-r-lg", () => {
    const card = /\.ps-card\s*\{[^}]*border-radius:\s*var\(--p-r-lg\)/s;
    const table = /\.ps-table\s*\{[^}]*border-radius:\s*var\(--p-r-lg\)/s;
    expect(card.test(cssLower), ".ps-card must ride --p-r-lg (6px)").toBe(true);
    expect(table.test(cssLower), ".ps-table must ride --p-r-lg (6px)").toBe(true);
  });

  it("kit-29 — the legend type axis renders the DS-mounted Frutiger", () => {
    expect(cssLower).toContain('font-family: "frutiger"');
    expect(cssLower).toMatch(/\[data-type="legend"\][^}]*\{[^}]*--p-font:\s*"frutiger"/s);
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
    for (const product of CORE_PRODUCTS) {
      expect(TOKENS.color.accent[product]?.light?.accent, `tokens.json#color.accent.${product} missing`).toBeTruthy();
    }
    // The retired ghxstship theme must not linger in the mirror either.
    expect(TOKENS.color.accent["ghxstship"], "tokens.json#color.accent.ghxstship must be removed").toBeUndefined();
  });
});

/**
 * Density-scale SSOT lock (v8.0 grid pass).
 *
 * The --k-* density tokens were the seed of the grid drift (authored 9/13/18/14px
 * off-grid, then copied as literals across the kit CSS). They now live in
 * tokens.json#density and every SPACING member must (a) resolve to a 4px-ramp rung
 * and (b) be emitted in atlvs-product.css as `var(--p-*)`, not a raw px — so the
 * density axis can never silently fork off-grid again.
 */
describe("Density tokens ↔ generated theme parity (v8.0 grid pass)", () => {
  const SPACING_MEMBERS = [
    "k-ctl-py",
    "k-ctl-px",
    "k-input-px",
    "k-row-py",
    "k-row-px",
    "k-card-pad",
    "k-gap",
    "k-stack",
  ] as const;

  // "8px" → "p-2", built from the canonical 4px ramp in tokens.json#spacing.
  const pxToStep = new Map<string, string>();
  for (const [step, px] of Object.entries(TOKENS.spacing)) {
    if (step === "grid") continue;
    pxToStep.set(px, step);
  }

  it("every --k-* spacing member resolves to a 4px-ramp rung in all three tiers", () => {
    const missing: string[] = [];
    for (const name of SPACING_MEMBERS) {
      const tiers = TOKENS.density[name]!;
      for (const tier of ["compact", "cozy", "spacious"] as const) {
        const px = tiers[tier]!;
        const step = pxToStep.get(px);
        if (!step) {
          missing.push(`${name}.${tier} = ${px} is not a --p-* rung (off the 4px ramp)`);
          continue;
        }
        if (!CSS.includes(`--${name}: var(--${step})`)) {
          missing.push(`${name}.${tier} = ${px} → "--${name}: var(--${step})" missing from atlvs-product.css`);
        }
      }
    }
    expect(missing, `density token forked off the ramp / the theme:\n${missing.join("\n")}`).toEqual([]);
  });

  it("no --k-* spacing member is authored as a raw off-grid px (the pre-v8.0 defect)", () => {
    const raw: string[] = [];
    for (const name of SPACING_MEMBERS) {
      // a digit immediately after the colon = a raw px literal instead of var(--p-*)
      if (new RegExp(`--${name}:\\s*\\d`).test(CSS)) raw.push(name);
    }
    expect(raw, `these --k-* spacing tokens still carry raw px (must be var(--p-*)): ${raw.join(", ")}`).toEqual([]);
  });
});
