import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * MONUMENT typography 11px floor guard (v8.0, AUDIT B-25).
 *
 * CLAUDE.md Typography: "no UI text below 11px". This test walks every
 * hand-authored TS/TSX source file and fails on any arbitrary Tailwind text
 * size under the floor — `text-[10px]`, `text-[9px]`, `text-[8px]`, … —
 * including responsive variants (`sm:text-[10px]`). Use `text-[11px]` (or the
 * canonical `.ps-caption` class for caption/metadata lines) instead.
 *
 * Out of scope (not UI text under the floor):
 *   - test files (`*.test.*`, `__tests__/`)
 *   - print PDFs (`src/lib/pdf/**`, @react-pdf style objects)
 *   - OG / opengraph image routes (`src/app/og/**`, `opengraph-image` files)
 *
 * Mirrors the theme guard family (spacing-grid / tokens-contract / contrast /
 * dataviz / signage).
 */
const ROOT = process.cwd();
const SRC = join(ROOT, "src");

// Any arbitrary text size from 1px to 10px — everything below the 11px floor.
const BELOW_FLOOR = /text-\[(?:[1-9]|10)px\]/;

const SKIP = [
  /\.test\.(ts|tsx)$/, // vitest guards / unit tests
  /(^|\/)__tests__\//, // test directories
  /^src\/lib\/pdf\//, // @react-pdf print documents
  /^src\/app\/og\//, // OG image routes
  /opengraph/i, // opengraph-image.tsx etc.
];

function isSkipped(rel: string): boolean {
  return SKIP.some((re) => re.test(rel));
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      const rel = relative(ROOT, abs).split("\\").join("/");
      if (!isSkipped(rel)) out.push(rel);
    }
  }
  return out;
}

describe("MONUMENT 11px type floor (src/**/*.{ts,tsx})", () => {
  it("no arbitrary Tailwind text size below 11px", () => {
    const offenders: string[] = [];
    for (const rel of walk(SRC)) {
      const lines = readFileSync(join(ROOT, rel), "utf8").split("\n");
      lines.forEach((line, i) => {
        if (BELOW_FLOOR.test(line)) {
          offenders.push(`${rel}:${i + 1}  ${line.trim().slice(0, 120)}`);
        }
      });
    }
    expect(
      offenders,
      `Text size below the MONUMENT 11px floor (CLAUDE.md Typography: ` +
        `"no UI text below 11px"). Use text-[11px] — or the canonical ` +
        `.ps-caption class for caption/metadata lines.\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
