/**
 * Trend CSS off-core-path mirror guard.
 *
 * kit-trends.css (the [data-trend] personalization skin, 23KB) is kept OFF the
 * core @import chain in theme/index.css per CLAUDE.md ("never on the core
 * path"). It loads instead as a runtime <link href="/theme/kit-trends.css">,
 * injected only when a non-default trend is active (theme-script pre-hydration
 * + ThemeProvider at runtime).
 *
 * That means a SERVED copy lives in public/theme/. The authored SSOT stays at
 * src/app/theme/kit-trends.css. This guard fails if the two fork, so an edit to
 * the SSOT that forgets to re-copy the public artifact can't ship a stale skin.
 * The font url()s are relative (`./assets/fonts/*.woff2`), so they resolve
 * against the stylesheet URL identically in both locations — hence a byte-exact
 * mirror is the correct invariant, and the fonts must exist under public too.
 *
 * To resync after editing the SSOT:
 *   cp src/app/theme/kit-trends.css public/theme/kit-trends.css
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SRC = join(ROOT, "src/app/theme/kit-trends.css");
const PUB = join(ROOT, "public/theme/kit-trends.css");

describe("kit-trends off-core-path mirror", () => {
  it("is NOT @imported by theme/index.css (stays off the core path)", () => {
    const index = readFileSync(join(ROOT, "src/app/theme/index.css"), "utf8");
    // The doc comment names the file; the invariant is that no @import pulls it
    // onto the core path.
    expect(index).not.toMatch(/@import\s+["'][^"']*kit-trends\.css/);
  });

  it("public served copy is byte-identical to the authored SSOT", () => {
    expect(existsSync(PUB), "public/theme/kit-trends.css must exist (the served artifact)").toBe(true);
    expect(readFileSync(PUB, "utf8")).toEqual(readFileSync(SRC, "utf8"));
  });

  it("ships every trend display font it references under public/theme", () => {
    // Derive the font basenames from the SSOT's @font-face url()s rather than
    // hardcoding them — hardcoding the (deliberately retired) trend face names
    // here would trip design-system.test.ts's dead-font guard.
    const css = readFileSync(SRC, "utf8");
    const fonts = [...css.matchAll(/url\(["']\.\/assets\/fonts\/([^"')]+\.woff2)["']\)/g)]
      .map((m) => m[1])
      .filter((f): f is string => Boolean(f));
    expect(fonts.length, "kit-trends.css should reference its @font-face woff2 assets").toBeGreaterThan(0);
    for (const f of fonts) {
      const p = join(ROOT, "public/theme/assets/fonts", f);
      expect(existsSync(p), `${f} must be served for the relative @font-face url() to resolve`).toBe(true);
    }
  });

  it("is loaded as a runtime <link>, not a bundler @import", () => {
    const script = readFileSync(join(ROOT, "src/app/theme/theme-script.ts"), "utf8");
    expect(script).toContain("/theme/kit-trends.css");
  });
});
