import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * COMPVSS 44px touch-target floor guard (WCAG 2.5.5 / 2.5.8 AA).
 *
 * The floor is real and enforced in `kit-mobile.css` — but nothing tested it,
 * which was the finding (mobile parity audit, S3): the repo has twelve theme
 * guards and none of them covered tap targets, so the floor could be deleted
 * or undercut silently.
 *
 * Two assertions, matching the two ways it breaks:
 *
 *  1. The CSS floor block still exists and still declares 44px. Deleting the
 *     rule is the loud failure mode.
 *  2. No mobile source file inline-styles an interactive control *under* the
 *     floor. Inline `style={{ height: 32 }}` beats the stylesheet on
 *     specificity and is invisible to a CSS-only check — and inline styling is
 *     the dominant authoring idiom in the mobile tree, so this is the likely
 *     regression, not the CSS.
 *
 * Mirrors the theme guard family (font-floor / spacing-grid / contrast).
 */
const ROOT = process.cwd();
const KIT_MOBILE = join(ROOT, "src/app/theme/kit-mobile.css");
const MOBILE_SRC = join(ROOT, "src/app/(mobile)");
const MOBILE_KIT = join(ROOT, "src/components/mobile");

const FLOOR_PX = 44;

const SKIP = [/\.test\.(ts|tsx)$/, /(^|\/)__tests__\//];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe("COMPVSS touch-target floor", () => {
  it("keeps the 44px min-height floor declared in kit-mobile.css", () => {
    const css = readFileSync(KIT_MOBILE, "utf8");
    // The floor block binds min-height:44px to the interactive selectors.
    expect(css).toMatch(/\.mobile-shell button/);
    expect(css).toMatch(/min-height:\s*44px/);
    // And the icon-only controls get width too.
    expect(css).toMatch(/min-width:\s*44px/);
  });

  it("has no inline style undercutting the floor on an interactive control", () => {
    const files = [...walk(MOBILE_SRC), ...walk(MOBILE_KIT)].filter(
      (f) => !SKIP.some((re) => re.test(relative(ROOT, f))),
    );

    // `height: 32` / `minHeight: 30` / `height: "36px"` inside a style object.
    // Only flags values BELOW the floor; anything >= 44 is fine, and `%`/`auto`
    // /`vh` values are not a fixed undercut so they're ignored.
    const SIZE = /\b(?:minHeight|height|minWidth|width)\s*:\s*["']?(\d+)(?:px)?["']?/g;

    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      const lines = src.split("\n");
      lines.forEach((line, i) => {
        // Only lines that plausibly style a tappable thing. Sizing an icon,
        // an avatar, or a spacer below 44px is legitimate and common, so
        // narrow to lines that also name an interactive class/role.
        if (!/\b(?:tap|ps-btn|tabbar|role="button"|onClick)\b/.test(line)) return;
        for (const m of line.matchAll(SIZE)) {
          const px = Number(m[1]);
          if (px > 0 && px < FLOOR_PX) {
            offenders.push(`${relative(ROOT, file)}:${i + 1} → ${m[0]} (floor is ${FLOOR_PX}px)`);
          }
        }
      });
    }

    expect(
      offenders,
      offenders.length
        ? `Interactive control(s) inline-styled below the ${FLOOR_PX}px touch floor:\n  ${offenders.join("\n  ")}`
        : undefined,
    ).toEqual([]);
  });
});
