import { describe, it, expect } from "vitest";
import { PRODUCT_ACCENTS, type ProductAccentKey } from "@/lib/brand";
import TOKENS from "@/app/theme/tokens.json";

/**
 * Brand-accent drift guard (THM-1).
 *
 * `PRODUCT_ACCENTS` in `src/lib/brand.ts` is the runtime escape-hatch mirror of
 * the design SSOT for surfaces that CANNOT read the `--p-accent` CSS variable
 * (OG / ImageResponse / HTML email). The canonical accent for each product lives
 * in `tokens.json` at `color.accent.<product>.light.accent`. This test asserts
 * the hand-maintained mirror can never silently fork from the SSOT.
 *
 * Compare is case-insensitive (the mirror upper-cases, the JSON lower-cases).
 */
const ACCENTS = (TOKENS as unknown as { color: { accent: Record<string, { light?: { accent?: string } }> } })
  .color.accent;

describe("PRODUCT_ACCENTS mirrors tokens.json color.accent.<product>.light.accent", () => {
  for (const product of Object.keys(PRODUCT_ACCENTS) as ProductAccentKey[]) {
    it(`${product} matches the canonical accent`, () => {
      const canonical = ACCENTS[product]?.light?.accent;
      expect(canonical, `tokens.json has no color.accent.${product}.light.accent`).toBeTruthy();
      expect(PRODUCT_ACCENTS[product].toLowerCase()).toBe((canonical ?? "").toLowerCase());
    });
  }
});
