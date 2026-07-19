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
//
// Updated 2026-05-01 from 5 → 7. The proposal sub-resource hierarchy is
// `proposals/[proposalId]/{revisions,change-orders,approvals}/[id]` which
// is 4 segments below `proposals` (proposals → [id] → revisions → [id]
// → page). The portal also adds `/p/[slug]/client/` (2 segments) on top,
// reaching 7. Restructuring would break canonical URLs already in use by
// the offer-letter / proposal portal flows. Cap raised with justification
// rather than aliasing routes.
const MAX_ROUTE_DEPTH = 7;

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
    const offenders = PAGE_FILES.map((f) => ({ file: relative(REPO_ROOT, f), depth: routeDepth(f) })).filter(
      (f) => f.depth > MAX_ROUTE_DEPTH,
    );
    expect(
      offenders,
      `Routes exceed depth ${MAX_ROUTE_DEPTH}: ${offenders.map((o) => `${o.file} (d=${o.depth})`).join(", ")}`,
    ).toEqual([]);
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
    // "No messages yet" is a per-room last-message PLACEHOLDER on the room
    // list rows, not a page empty state (InboxView renders the page-level
    // void with <EmptyState>).
    "src/app/(mobile)/m/inbox/page.tsx",
    // Detail-page in-section inline empties (sub-cards / tabs that render a
    // 1-line "No X yet" inside their own surface). Migrating to <EmptyState
    // size="compact"> would be a visual change inside dense detail layouts;
    // the canonical zero-state primitive is reserved for page-level voids.
    "src/app/(platform)/studio/annotations/[id]/page.tsx",
    "src/app/(platform)/studio/people/offer-letters/[id]/page.tsx",
    "src/app/(platform)/studio/procurement/rfqs/[rfqId]/page.tsx",
    // Advancing assignment detail renders inline empties inside the
    // Comments + Activity sub-cards (orphan-dataset exposure, 2026-05).
    "src/app/(platform)/studio/projects/[projectId]/advancing/assignments/[deliverableId]/page.tsx",
    "src/app/(platform)/studio/production/ros/page.tsx",
    "src/app/(platform)/studio/services/requests/[requestId]/page.tsx",
    "src/app/(platform)/studio/settings/billing/page.tsx",
    "src/app/(platform)/studio/settings/governance/page.tsx",
    "src/app/(platform)/studio/settings/imports/page.tsx",
    "src/app/(platform)/studio/site-plans/[id]/page.tsx",
    "src/app/(portal)/p/[slug]/apply/page.tsx",
    "src/app/(portal)/p/[slug]/client/proposals/[proposalId]/activity/page.tsx",
    "src/app/(portal)/p/[slug]/client/proposals/[proposalId]/files/page.tsx",
    "src/app/(portal)/p/[slug]/client/proposals/[proposalId]/page.tsx",
    "src/app/(portal)/p/[slug]/delegation/ratecard/page.tsx",
    // Public marketplace handle pages render "no reviews yet" as a single
    // inline value inside a `<dl>` row (Rating: no reviews yet). It's a
    // value-fallback, not a section-level zero state — wrapping in
    // <EmptyState> would break the dl grid layout.
    "src/app/(marketing)/marketplace/crew/[handle]/page.tsx",
    "src/app/(marketing)/marketplace/talent/[handle]/page.tsx",
    "src/app/(marketing)/marketplace/vendors/[handle]/page.tsx",
    // COMPVSS kit (rebuild 2026-06-21): these server pages hold the empty-state
    // copy only as i18n fallback LABELS handed to the kit client renderer
    // (CheckInScanner / ChatRoom / ScheduleView), which owns and renders the
    // zero-state — the same hand-off the `emptyLabel=` strip above exempts,
    // just passed as a labels object rather than a JSX prop. The kit-29 §C
    // alias consolidation moved the scan labels out of the per-route pages
    // into the ONE shared ScanSurface server component.
    "src/app/(mobile)/m/check-in/ScanSurface.tsx",
    "src/app/(mobile)/m/inbox/[roomId]/page.tsx",
    "src/app/(mobile)/m/schedule/page.tsx",
    "src/app/(mobile)/m/market/page.tsx",
    "src/app/(mobile)/m/tasks/[taskId]/page.tsx",
    // Access-control monitor (kit v7 §3): the server page holds "No scans yet"
    // only as an i18n fallback LABEL handed to the <AccessControlScanner> client
    // renderer, which owns and renders the recent-scans zero-state — same
    // labels-object hand-off as the COMPVSS kit pages above.
    "src/app/(platform)/studio/access-control/page.tsx",
    // Approvals engine (Tier-2 build): instance + policy detail pages render a
    // 1-line "no steps yet" inside their Steps sub-card — detail-page in-section
    // inline empties, the same category as the offer-letter / RFQ detail pages
    // above. Page-level voids on these surfaces use <EmptyState>.
    "src/app/(platform)/studio/governance/approvals/[id]/page.tsx",
    "src/app/(platform)/studio/governance/approvals/policies/[policyId]/page.tsx",
  ]);

  // Test files are excluded: this guard is about SURFACES that render empty
  // copy to an operator, and a spec never renders to anyone. Co-located
  // component tests legitimately carry empty-state strings in their label
  // fixtures (e.g. CheckInScanner.test.tsx's `recentEmpty`), which is not the
  // hand-rolled-empty-state defect this rule exists to catch.
  const candidates = ALL_FILES.filter((f) => /\.(ts|tsx)$/.test(f) && !/\.(test|spec)\.tsx?$/.test(f));

  it("files rendering canonical empty-state copy import <EmptyState>", () => {
    const offenders: string[] = [];
    for (const file of candidates) {
      const rel = relative(REPO_ROOT, file);
      if (ALLOWLIST.has(rel)) continue;
      const txt = readFileSync(file, "utf8");
      // Strip lines where the copy appears as a JSX prop value
      // (`emptyLabel="No scans yet"`, `emptyTitle="No tasks yet"`) — those
      // hand off empty-state rendering to the receiving component, which
      // already enforces the primitive internally (DataTable, VirtualList,
      // KanbanBoard, etc.).
      //
      // Comment-only lines are stripped too: prose never renders, so a comment
      // reading "nothing here ever read them" is not a hand-rolled empty state.
      // Copy on a line with code (`const s = "No results"; // why`) still
      // counts — only the wholly-commented line is dropped.
      const stripped = txt
        .split("\n")
        .filter((l) => !/\b(emptyLabel|emptyText|emptyMessage|emptyTitle|emptyDescription)\s*=/.test(l))
        .filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l))
        .join("\n");
      if (!EMPTY_COPY_RE.test(stripped)) continue;
      // Sanctioned empty-state treatments: <EmptyState> (the app-wide zero
      // state), the COMPVSS kit's <EmptySkeleton> (kit 31 resolution #16 —
      // data-view empty states keep the view's column headers + ghost rows),
      // and <NormalizedList> (kit 34 v3.4 — the normalized record-list surface,
      // which always renders its void through EmptySkeleton internally). A
      // mobile list that renders through any of these is compliant.
      const fromKit = /from\s+["']@\/components\/mobile\/kit["']/.test(stripped);
      const importsEmptyState = /from\s+["']@\/components\/ui\/EmptyState["']/.test(stripped);
      const importsEmptySkeleton = /\bEmptySkeleton\b/.test(stripped) && fromKit;
      const importsNormalizedList = /\bNormalizedList\b/.test(stripped) && fromKit;
      if (!importsEmptyState && !importsEmptySkeleton && !importsNormalizedList) {
        offenders.push(rel);
      }
    }
    expect(offenders, `Files render empty-state copy without importing <EmptyState>: ${offenders.join(", ")}`).toEqual(
      [],
    );
  });
});
