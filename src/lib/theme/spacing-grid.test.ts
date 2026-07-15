import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 4px spacing-grid conformance guard (v8.0 grid pass).
 *
 * The binding grid for this design system is the 4px spacing base
 * (tokens.json#spacing → --p-0-5 … --p-24). There is no formal N-column / gutter
 * token, so "column snap" is N/A — the violation is any spacing/position px that
 * isn't a rung on the 4px ramp. This test scans every hand-authored CSS file and
 * fails on an off-grid literal in a spacing/position property, so a re-introduced
 * `padding: 13px` / `gap: 10px` is caught in CI (the static class of bug the
 * GRID_SPACING_AUDIT enumerated). Mirrors the four existing theme guards
 * (tokens-contract / contrast / dataviz / signage).
 *
 * Off-grid spacing belongs on the ramp: snap to var(--p-*) (see MIGRATION.md remap),
 * or — for control/row/card padding & gaps — the density tokens var(--k-*).
 */
const ROOT = process.cwd();

// Hand-authored CSS (the generated color region of atlvs-product.css carries no
// spacing literals, so scanning the whole file is safe).
const CSS_FILES = [
  "src/app/globals.css",
  "src/app/theme/themes/atlvs-product.css",
  "src/app/theme/kit-documents.css",
  "src/app/theme/kit-mobile.css",
  "src/app/theme/kit-onboarding.css",
  "src/app/theme/kit-platform.css",
  "src/app/theme/kit-reports.css",
  "src/app/theme/kit-signage.css",
  "src/app/theme/primitives.css",
  "src/app/theme/index.css",
];

// The 4px ramp (tokens.json#spacing). 0 is always allowed.
const NAMED = new Set([0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96]);

// Spacing / position properties held to the grid (NOT border-width / font-size /
// border-radius / line-height — those are separate scales).
const SPACING_PROP =
  /^(padding|margin|gap|row-gap|column-gap|grid-gap|inset|top|right|bottom|left|scroll-padding|scroll-margin)(-(top|right|bottom|left|block|inline|block-start|block-end|inline-start|inline-end|start|end))?$/;

const DECL = /([A-Za-z-]+)\s*:\s*([^;{}]+)/g;
const PX = /(-?\d+(?:\.\d+)?)px/g;

/**
 * By-design exceptions (documented in REPO_UPDATE_GRID.md §2):
 *   - negative values  → overlap / notch / collapse offsets (badge counts, -1px borders)
 *   - 9999px           → off-screen honeypot / screen-reader idiom
 *   - |v| < 2 (0.5/1/1.5px) → hairline optical nudges
 */
function isAllowed(v: number): boolean {
  if (v < 0) return true;
  if (v === 9999) return true;
  if (Math.abs(v) < 2) return true;
  return NAMED.has(v);
}

/**
 * Per-line escape hatch: `/* grid-exempt: <reason> *\/` on the same line.
 *
 * The grid is a LAYOUT scale. A fixed-size component's INTERNAL geometry is a
 * different thing wearing the same property names, and snapping it to 4px
 * doesn't tidy it — it breaks it. The COMPVSS switch is the proof: a 46×27
 * track with a 21px knob centres at exactly 3px, and 3→4 / 22→24 left the knob
 * 4px from the top and 2px from the bottom, 1px from the right rail when on.
 * The toggle rendered visibly crooked, and the guard was the reason.
 *
 * Same spirit as the border-width / font-size / radius carve-outs above: those
 * are separate scales, and so is this. Narrow by construction — the annotation
 * names a reason and covers one line.
 */
const GRID_EXEMPT = /\/\*\s*grid-exempt:/;

function scan(rel: string): string[] {
  const raw = readFileSync(join(ROOT, rel), "utf8");
  // Keep the raw lines so the exemption annotation survives comment-stripping.
  const rawLines = raw.split("\n");
  // strip comments so digits inside /* ... */ aren't matched
  const src = raw.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  const offenders: string[] = [];
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    if (GRID_EXEMPT.test(rawLines[i] ?? "")) return;
    let d: RegExpExecArray | null;
    DECL.lastIndex = 0;
    while ((d = DECL.exec(line)) !== null) {
      const prop = d[1]!.trim();
      const value = d[2]!;
      if (!SPACING_PROP.test(prop)) continue;
      let p: RegExpExecArray | null;
      PX.lastIndex = 0;
      while ((p = PX.exec(value)) !== null) {
        const v = parseFloat(p[1]!);
        if (!isAllowed(v)) offenders.push(`${rel}:${i + 1}  ${prop}: ${p[1]}px`);
      }
    }
  });
  return offenders;
}

describe("4px spacing-grid conformance (hand-authored CSS)", () => {
  it("no spacing/position property uses an off-grid px literal", () => {
    const offenders = CSS_FILES.flatMap(scan);
    expect(
      offenders,
      `Off-grid spacing literal(s) found — snap to var(--p-*) (4px ramp) or var(--k-*) ` +
        `(density tokens). See MIGRATION.md remap.\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
