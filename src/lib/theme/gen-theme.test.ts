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
    // The a11y text-3 fix + the LEG3ND CTA must be present in the generated CSS.
    expect(t).toContain("--p-text-3: #656d7a");
    expect(t).toContain("--p-text-3: #9098a4");
    expect(t).toContain("--p-accent-cta: #b8430a"); // LEG3ND light CTA
    expect(t).not.toContain("#8c95a3"); // retired failing tertiary gray
  });
});
