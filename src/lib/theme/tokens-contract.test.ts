import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Token SSOT lock (alignment Move D1).
 *
 * `tokens.json` is the single hand-authored source of truth; the generated
 * theme `src/app/theme/themes/atlvs-product.css` is its derivative. This test
 * asserts that every color value declared in tokens.json actually appears in
 * the generated theme — so the two can never silently fork again. (We assert
 * containment, not a byte-for-byte codegen, because the CSS also carries the
 * component layer; the values are the contract.)
 */

const TOKENS = JSON.parse(
  readFileSync(join(process.cwd(), "src/app/theme/tokens.json"), "utf8"),
) as {
  version: string;
  color: {
    neutral: Record<"light" | "dark", Record<string, string>>;
    surface: Record<"light" | "dark", Record<string, string>>;
    accent: Record<string, Record<"light" | "dark", Record<string, string>>>;
  };
};

const CSS = readFileSync(join(process.cwd(), "src/app/theme/themes/atlvs-product.css"), "utf8").toLowerCase();

/** All hex literals assigned to a given `--p-<name>` custom property in the CSS. */
function declaredValues(prop: string): Set<string> {
  const re = new RegExp(`--p-${prop}:\\s*(#[0-9a-f]{3,8})`, "g");
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(CSS)) !== null) out.add(m[1]!);
  return out;
}

describe("Token SSOT ↔ generated theme parity (Move D1)", () => {
  it("the 12-step neutral ramp (v7.0 surface seed) is emitted whole in both modes", () => {
    for (const mode of ["light", "dark"] as const) {
      for (const [step, hex] of Object.entries(TOKENS.color.neutral[mode])) {
        if (step.startsWith("_")) continue;
        expect(
          declaredValues(`neutral-${step}`).has(hex.toLowerCase()),
          `neutral-${step} (${mode}) = ${hex} missing from the generated theme`,
        ).toBe(true);
      }
    }
  });

  it("surfaces map onto the ramp — text-3 (a11y floor) + darkened text-2 resolve to their seed", () => {
    // text-3 holds the AA floor at ramp step 600; text-2 darkened to step 700.
    expect(declaredValues("neutral-600").has(TOKENS.color.surface.light["text-3"]!.toLowerCase())).toBe(true);
    expect(declaredValues("neutral-600").has(TOKENS.color.surface.dark["text-3"]!.toLowerCase())).toBe(true);
    expect(declaredValues("neutral-700").has(TOKENS.color.surface.light["text-2"]!.toLowerCase())).toBe(true);
    expect(declaredValues("neutral-700").has(TOKENS.color.surface.dark["text-2"]!.toLowerCase())).toBe(true);
    // Surface tokens reference the ramp via var(), not a forked literal.
    expect(CSS.includes("--p-text-3: var(--p-neutral-600)")).toBe(true);
    // The retired failing value must NOT survive anywhere in the theme.
    expect(CSS.includes("#8c95a3"), "retired inaccessible text-3 #8C95A3 must not survive").toBe(false);
  });

  it("every per-product accent / accent-text / accent-cta value exists in the theme", () => {
    const props = {
      accent: declaredValues("accent"),
      "accent-text": declaredValues("accent-text"),
      "accent-cta": declaredValues("accent-cta"),
      "accent-cta-contrast": declaredValues("accent-cta-contrast"),
    } as const;
    const missing: string[] = [];
    for (const product of ["atlvs", "compvss", "gvteway", "legend"] as const) {
      for (const mode of ["light", "dark"] as const) {
        const block = TOKENS.color.accent[product]![mode]!;
        for (const key of ["accent", "accent-text", "accent-cta", "accent-cta-contrast"] as const) {
          const val = block[key]?.toLowerCase();
          if (!val) continue;
          if (!props[key].has(val)) missing.push(`${product}.${mode}.${key} = ${val} (not in atlvs-product.css)`);
        }
      }
    }
    expect(missing, `tokens.json values absent from the generated theme — the SSOT forked:\n${missing.join("\n")}`).toEqual(
      [],
    );
  });

  it("v8 mono-green accent is fully represented across products", () => {
    // v8.0 — the whole ecosystem resolves to ONE accent (Accent 1 #2edb3a),
    // bright in light, lifted (#3ae243) in dark; AA text inks #147d1c / #6ee176.
    expect(declaredValues("accent").has("#2edb3a")).toBe(true);
    expect(declaredValues("accent").has("#3ae243")).toBe(true);
    expect(declaredValues("accent-text").has("#147d1c")).toBe(true);
    expect(declaredValues("accent-text").has("#6ee176")).toBe(true);
  });

  it("tokens.json is stamped v8.0 (GHXSTSHIP mono-green)", () => {
    expect(TOKENS.version).toBe("8.0");
  });
});
