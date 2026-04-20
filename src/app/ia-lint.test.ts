import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * IA lint guardrails (docs/ia/02-navigation-redesign.md §7 #9, #11).
 *
 * - Depth cap: no route file may live below depth 5 in `src/app/**`. The
 *   five tiers are Global → Module → Hub → Page → Detail; anything deeper
 *   (depth 6+) should be split by module instead.
 * - Empty-state enforcement: if a page/component renders "No X yet",
 *   "No results", or "Nothing here" copy, it must import `<EmptyState>`
 *   from `@/components/ui/EmptyState` so the visual treatment is
 *   consistent across the app.
 *
 * These checks live as a vitest spec rather than an ESLint rule because
 * depth counting + multi-string presence are cleaner expressed as file
 * walks than as AST selectors, and the test CI path is already wired.
 */

const REPO_ROOT = process.cwd();
const APP_DIR = join(REPO_ROOT, "src/app");

// Max permitted dir depth below src/app for a `page.tsx` file. We don't
// count the file itself — just the path segments between `src/app` and
// the file. Route groups (parenthesized) contribute zero depth, matching
// how Next.js computes URL depth.
const MAX_ROUTE_DEPTH = 5;

// Dynamic segments like `[id]` + segments with internal slashes both
// count as one. The segment list after `src/app` (minus the filename)
// with `(group)` entries removed is the URL-path depth.
function routeDepth(file: string): number {
  const rel = relative(APP_DIR, file);
  const parts = rel.split("/").slice(0, -1); // drop filename
  return parts.filter((p) => !/^\(.+\)$/.test(p)).length;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  const entries = readdirSync(dir);
  for (const name of entries) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      out.push(...walk(full));
    } else if (st.isFile()) {
      out.push(full);
    }
  }
  return out;
}

const ALL_FILES = walk(APP_DIR);
const PAGE_FILES = ALL_FILES.filter((f) => /page\.tsx?$/.test(f));

describe("IA depth cap", () => {
  it("no route file lives deeper than 5 segments (IA spec §7 #11)", () => {
    const offenders = PAGE_FILES
      .map((f) => ({ file: relative(REPO_ROOT, f), depth: routeDepth(f) }))
      .filter((f) => f.depth > MAX_ROUTE_DEPTH);
    expect(offenders, `Routes exceed depth ${MAX_ROUTE_DEPTH}: ${offenders.map((o) => `${o.file} (d=${o.depth})`).join(", ")}`).toEqual([]);
  });
});

describe("EmptyState enforcement (IA spec §7 #9)", () => {
  // Regex for canonical empty-state copy we've seen in the codebase.
  // Match whole-word forms so we don't trip on content strings like
  // "notes" or "no-op" that merely contain the letters.
  const EMPTY_COPY_RE = /\b(No\s+\w+\s+yet|No\s+results|Nothing\s+here|No\s+\w+\s+found)\b/i;

  // Files that legitimately render empty-state copy outside the primitive
  // (e.g. the primitive itself + search dropdowns whose empty state is a
  // tiny dropdown item, not a full page state).
  const ALLOWLIST = new Set<string>([
    "src/components/ui/EmptyState.tsx",
    // Search dropdowns render a 1-line "No results" inside the menu;
    // wrapping in <EmptyState> would be a visual regression.
    "src/components/PlatformSidebar.tsx",
    "src/components/CommandPalette.tsx",
    "src/components/ShortcutDialog.tsx",
    "src/components/deliverable-templates/TemplatePicker.tsx",
    // Self-reference: this spec mentions the copy patterns in its own docstring.
    "src/app/ia-lint.test.ts",
  ]);

  const candidates = ALL_FILES.filter((f) => /\.(ts|tsx)$/.test(f));

  it("files rendering canonical empty-state copy import <EmptyState>", () => {
    const offenders: string[] = [];
    for (const file of candidates) {
      const rel = relative(REPO_ROOT, file);
      if (ALLOWLIST.has(rel)) continue;
      const txt = readFileSync(file, "utf8");
      // Strip lines where the copy appears as a JSX prop value
      // (`emptyLabel="No scans yet"`) — those hand off empty-state
      // rendering to the receiving component, which already enforces
      // the primitive internally (DataTable, VirtualList, etc.).
      const stripped = txt
        .split("\n")
        .filter((l) => !/\b(emptyLabel|emptyText|emptyMessage)\s*=/.test(l))
        .join("\n");
      if (!EMPTY_COPY_RE.test(stripped)) continue;
      if (!/from\s+["']@\/components\/ui\/EmptyState["']/.test(stripped)) {
        offenders.push(rel);
      }
    }
    expect(offenders, `Files render empty-state copy without importing <EmptyState>: ${offenders.join(", ")}`).toEqual([]);
  });
});
