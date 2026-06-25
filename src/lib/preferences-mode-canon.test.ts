import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Guard — /me/preferences must not conflate COLOR MODE with the theme SLUG.
 *
 * The bug: the preferences page rendered a light/dark/system radio under
 * `name="theme"`, but `savePreferencesAction` validated `theme` as the theme
 * SLUG enum (["atlvs-product","system"]). Picking light/dark left no valid value
 * → `theme` failed zod → the ENTIRE save (locale/timezone/density/consent) was
 * silently rejected. Color mode is the orthogonal client-managed `data-mode`
 * axis (edited at /me/settings/appearance), NOT a field on this server form.
 *
 * This asserts the conflation can't return: the preferences page submits no
 * `name="theme"` control, and the action's schema declares no `theme` field
 * (the slug is written as a constant in the upsert).
 */
const ROOT = process.cwd();
const PAGE = "src/app/(personal)/me/preferences/page.tsx";
const ACTION = "src/app/(personal)/me/preferences/actions.ts";
const SCHEMA = "src/app/(personal)/me/preferences/schema.ts";

describe("preferences mode/theme canon", () => {
  it("the preferences page submits no name=\"theme\" control (mode lives at /me/settings/appearance)", () => {
    // Strip comments first — the page's own explanatory note legitimately
    // mentions the retired name="theme" in prose.
    const src = readFileSync(join(ROOT, PAGE), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "") // /* */ and {/* */}
      .replace(/^\s*\/\/.*$/gm, ""); // // line comments
    expect(src.includes('name="theme"'), `${PAGE} must not render a name="theme" input — color mode is client-managed`).toBe(
      false,
    );
  });

  it("the preferences schema + action do not read/validate a `theme` form field", () => {
    const action = readFileSync(join(ROOT, ACTION), "utf8");
    expect(/theme:\s*fd\.get/.test(action), "actions.ts must not parse `theme` from the form").toBe(false);
    // The schema (extracted to schema.ts) must not declare a `theme` field — the
    // skin slug takes its DB default on insert and is left untouched on update.
    const schema = readFileSync(join(ROOT, SCHEMA), "utf8");
    expect(/theme:\s*z\./.test(schema), "schema.ts must not declare a `theme` field").toBe(false);
  });
});
