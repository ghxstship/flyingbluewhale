import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { regionBody, renderRegion, THEME_PATH, TOKENS_PATH } from "../../../scripts/gen-theme-tokens.mjs";

/**
 * "Generated file is dirty" guard (alignment Move D1).
 *
 * The color-identity blocks of the generated theme (brand-identity tokens,
 * surfaces, per-product accent, accent-intensity sources) are emitted FROM
 * tokens.json by scripts/gen-theme-tokens.mjs into the `@gen:brand` /
 * `@gen:tokens` marked regions of atlvs-product.css. This test fails CI if
 * those regions drift from what the generator would produce — i.e. if someone
 * edited a token in tokens.json without running `npm run gen:theme`, or
 * hand-edited the generated CSS. The fix is always: `npm run gen:theme`.
 */

const tokens = JSON.parse(readFileSync(TOKENS_PATH, "utf8"));
const theme = readFileSync(THEME_PATH, "utf8");

describe("Generated theme regions ↔ tokens.json (Move D1)", () => {
  for (const id of ["brand", "tokens"] as const) {
    it(`@gen:${id} region is in sync (run \`npm run gen:theme\` if this fails)`, () => {
      expect(regionBody(theme, id)).toBe(renderRegion(tokens, id));
    });
  }

  it("the generated regions carry the canonical values (spot-check)", () => {
    const t = regionBody(theme, "tokens");
    // v7.0 — surfaces map onto the 12-step neutral ramp; the a11y text-3 hex
    // now lives on the ramp (step 600) and text-3 references it via var().
    expect(t).toContain("--p-neutral-600: #656d7a"); // light tertiary text seed (v7 ramp)
    expect(t).toContain("--p-neutral-600: #9098a4"); // dark tertiary text seed (v7 ramp)
    expect(t).toContain("--p-text-3: var(--p-neutral-600)");
    // text-2 darkened off step 700 for clearer hierarchy.
    expect(t).toContain("--p-neutral-700: #4a5563"); // light secondary text seed (v7 ramp)
    expect(t).toContain("--p-accent-cta: #ad220a"); // ATLVS light CTA (v8 palette-locked volcanic red)
    expect(t).not.toContain("#8c95a3"); // retired failing tertiary gray
  });
});
