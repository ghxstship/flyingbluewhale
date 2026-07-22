import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";

/**
 * Loading-boundary ratchet (UI/UX canon audit 2026-07, findings D-3 / C3 /
 * COMP-6).
 *
 * History: the 2026-07-21 COMPVSS surface audit added `loading.tsx` to 26
 * `/m` routes specifically to fix tap-lag ("Finance won't open") — and the
 * very next wave of kit-34 surfaces shipped without them. Unguarded fixes
 * regress; this test is the ratchet.
 *
 * RULE — every route under `(mobile)/m` and `(platform)/studio` whose
 * `page.tsx` awaits data before first paint must have a `loading.tsx` in its
 * own segment or an ancestor segment STRICTLY BELOW the shell content root.
 * The group-level boundaries (`(mobile)/loading.tsx`, `(platform)/loading.tsx`)
 * do not count: they wrap the persistent shell layout and never re-trigger on
 * sibling navigations inside `/m` or `/studio` (the exact failure mode D-3
 * documents), and the shell roots themselves (`m/`, `studio/`) are excluded so
 * a single blanket file cannot satisfy the ratchet for every child surface.
 *
 * FETCH HEURISTIC (mechanical, low-false-positive): the page source contains a
 * VALUE import from `@/lib/db/**` or `@/lib/supabase/server` — the org-scoped
 * read layer. Importing either in a server page means the component awaits
 * Supabase before rendering. Type-only imports (`import type ... from`) are
 * stripped first, so pages that only borrow types (e.g. the client-safe
 * `catalog-kinds` labels) are not flagged. Pages that merely await
 * `requireSession()`/`getRequestT()` are intentionally NOT flagged — those
 * resolve from cookies in single-digit milliseconds and need no skeleton.
 */
const ROOT = process.cwd();

const SHELL_ROOTS = [
  join(ROOT, "src/app/(mobile)/m"),
  join(ROOT, "src/app/(platform)/studio"),
];

/** Value imports from the data layer (type-only imports removed beforehand). */
const FETCH_IMPORT_RE = /from\s+["']@\/lib\/(?:db\/|supabase\/server)/;
/** `import type { ... } from "@/lib/db/..."` — no data fetch implied. */
const TYPE_ONLY_IMPORT_RE =
  /import\s+type\s[^;]*?from\s*["']@\/lib\/(?:db\/|supabase\/server)[^"']*["']/g;

/**
 * Routes a human verified may fetch WITHOUT a segment-level loading boundary.
 * Keep short; every entry needs a reason.
 */
const EXEMPT: { page: string; reason: string }[] = [
  {
    page: "src/app/(platform)/studio/page.tsx",
    reason:
      "Shell home. Its heavy reads (Event Spine, Copilot rail) already stream via their own Suspense islands, and a studio/loading.tsx would sit at the excluded shell root by design (it would otherwise blanket-cover every child tree and gut per-tree skeleton matching).",
  },
  {
    page: "src/app/(mobile)/m/page.tsx",
    reason:
      "Shell home. Same shape as the studio home: an m/loading.tsx would live at the excluded shell root; the home's data tiles render inside the persistent tab shell on first app load, not on sibling taps.",
  },
];

function* walkPages(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walkPages(p);
    else if (entry.name === "page.tsx") yield p;
  }
}

function fetchesData(pagePath: string): boolean {
  const src = readFileSync(pagePath, "utf8").replace(TYPE_ONLY_IMPORT_RE, "");
  return FETCH_IMPORT_RE.test(src);
}

/** Covered iff loading.tsx exists in the page's dir or any ancestor strictly below the shell root. */
function hasBoundary(pagePath: string, shellRoot: string): boolean {
  let dir = dirname(pagePath);
  while (dir !== shellRoot) {
    if (existsSync(join(dir, "loading.tsx"))) return true;
    dir = dirname(dir);
  }
  return false;
}

describe("loading-boundary ratchet (audit D-3 / C3 / COMP-6)", () => {
  it("every data-fetching route under /m and /studio has a segment-level loading.tsx", () => {
    const exemptSet = new Set(EXEMPT.map((e) => e.page));
    const violations: string[] = [];

    for (const shellRoot of SHELL_ROOTS) {
      for (const page of walkPages(shellRoot)) {
        const rel = relative(ROOT, page);
        if (exemptSet.has(rel)) continue;
        if (!fetchesData(page)) continue;
        if (!hasBoundary(page, shellRoot)) violations.push(rel);
      }
    }

    expect(
      violations,
      `Data-fetching routes without a loading.tsx boundary (add a PageSkeleton loading.tsx to the route or its tree root — see the 07-21 COMPVSS wave pattern):\n${violations.join("\n")}`,
    ).toEqual([]);
  });

  it("exempt entries still exist and still fetch (prune stale exemptions)", () => {
    for (const { page } of EXEMPT) {
      const abs = join(ROOT, page);
      expect(existsSync(abs), `${page} is exempt but no longer exists`).toBe(true);
      expect(fetchesData(abs), `${page} is exempt but no longer fetches data — remove the exemption`).toBe(true);
    }
  });
});
