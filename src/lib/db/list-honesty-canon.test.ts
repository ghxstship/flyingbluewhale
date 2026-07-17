import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/**
 * List-honesty canon guardrail (AUDIT.md F-01).
 *
 * `listOrgScoped` silently caps at 100 rows. A `page.tsx` that renders that
 * array as "the list" LIES once the org passes the cap: records silently
 * disappear, and a `rows.length` subtitle under-reports the population.
 *
 * This spec statically scans every `src/app/**\/page.tsx` that calls the
 * capped `listOrgScoped(` and requires an honesty marker in the same file:
 *
 *   - `listOrgScopedWithCount(` — capped window + exact total in one call
 *   - `countOrgScoped(`         — separate exact-count aggregate
 *   - `listOrgScopedPage(`      — cursor/offset pagination
 *   - `totalCount`              — the count is threaded to the DataTable
 *                                 truncation indicator / subtitle
 *   - `PagerNav`                — the numbered server pager is mounted
 *
 * Pages under `/new/` or `/edit/` are exempt (they load select-box options,
 * not list surfaces). Everything else must either carry a marker or be
 * annotated in ALLOWLIST below with the reason the cap is acceptable.
 * Adding a NEW unannotated capped list page is the regression this spec
 * exists to catch — convert it (see `src/lib/db/resource.ts` JSDoc) or
 * annotate it here with a reason a reviewer can veto.
 */

const REPO_ROOT = process.cwd();
const APP_DIR = join(REPO_ROOT, "src/app");

// Files that call the capped listOrgScoped( without an honesty marker,
// each with the audited reason the 100-row cap is acceptable TODAY.
// Do not add entries without a reason; prefer converting the page.
const ALLOWLIST = new Map<string, string>([
  // -- Mobile kit surfaces: field PWA card lists over the persona's own /
  //    current-project slice; kit client components own the layout and a
  //    pager does not exist in the COMPVSS kit yet (KIT_CANON.md).
  ["src/app/(mobile)/m/daily-log/page.tsx", "field surface; per-project daily logs, small window"],
  // /m/incidents left this list with the kit-29 §C alias consolidation: the
  // shared IncidentSurface reads uncapped (no listOrgScoped default cap).
  ["src/app/(mobile)/m/schedule/page.tsx", "field schedule; date-window bounded by nature"],
  ["src/app/(mobile)/m/tasks/page.tsx", "field task list; kit client (TasksList) owns rendering"],
  // -- Print / detail / calendar shapes (not open-ended list tables).
  ["src/app/(platform)/studio/accreditation/print/page.tsx", "print sheet; deliberate fixed batch"],
  ["src/app/(platform)/studio/calendar/page.tsx", "calendar grid; visible-range bounded"],
  ["src/app/(platform)/studio/schedule/page.tsx", "schedule view; date-window bounded"],
  ["src/app/(platform)/studio/finance/ledger/[id]/page.tsx", "detail page; child rows of one ledger"],
  ["src/app/(platform)/studio/sales/beos/[id]/page.tsx", "detail page; sibling lookup only"],
  ["src/app/(platform)/studio/sales/diary/page.tsx", "diary calendar; week-window bounded (limit 0 on spaces vocab)"],
  // -- Aggregate / hub pages (rows feed derived tiles, not an open list).
  ["src/app/(platform)/studio/finance/reports/page.tsx", "aggregate charts page, not a record list"],
  ["src/app/(platform)/studio/procurement/page.tsx", "module hub; metric tiles + short previews"],
  ["src/app/(platform)/studio/sustainability/carbon/page.tsx", "aggregate charts page"],
  // -- Small-vocabulary registers (bounded by business reality, reviewed).
  ["src/app/(platform)/studio/finance/accounts/page.tsx", "chart of accounts; bounded GL structure"],
  ["src/app/(platform)/studio/sales/diary/spaces/page.tsx", "function-space vocabulary; small register"],
  ["src/app/(platform)/studio/safety/playbooks/page.tsx", "playbook register; small, derived published count"],
  ["src/app/(platform)/studio/programs/risk/page.tsx", "program risk register; per-program bounded"],
  // -- 500-cap + derived facet filters; conversion needs server-side facet
  //    counts, deferred to the pagination rollout (AUDIT.md next tier).
  ["src/app/(platform)/studio/logistics/services/page.tsx", "500-cap + category facet; deferred"],
  ["src/app/(platform)/studio/workforce/housing/page.tsx", "500-cap + stakeholder facet; deferred"],
  ["src/app/(platform)/studio/finance/tax/calculations/page.tsx", "tax calc register; deferred"],
  ["src/app/(platform)/studio/assets/warranties/page.tsx", "warranty register; expiry-window shaped; deferred"],
]);

const MARKER_RE = /countOrgScoped\(|listOrgScopedPage\(|listOrgScopedWithCount\(|totalCount|PagerNav/;
const CAPPED_CALL = "listOrgScoped(";

function* walkPages(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      yield* walkPages(p);
    } else if (name === "page.tsx") {
      yield p;
    }
  }
}

function rel(p: string): string {
  return relative(REPO_ROOT, p).split(sep).join("/");
}

describe("list-honesty canon (F-01)", () => {
  const cappedListPages: string[] = [];
  for (const abs of walkPages(APP_DIR)) {
    const r = rel(abs);
    // Create/edit forms load select-box options, not list surfaces.
    if (r.includes("/new/") || r.includes("/edit/")) continue;
    const txt = readFileSync(abs, "utf8");
    if (!txt.includes(CAPPED_CALL)) continue;
    if (MARKER_RE.test(txt)) continue;
    cappedListPages.push(r);
  }

  it("every page rendering a capped listOrgScoped window carries an honesty marker or an annotated allowlist entry", () => {
    const offenders = cappedListPages.filter((r) => !ALLOWLIST.has(r));
    const summary = offenders.map((o) => `  ${o}`).join("\n");
    expect(
      offenders,
      `These page.tsx files render a silently-capped listOrgScoped( result with no totalCount / pagination marker (AUDIT.md F-01 — records silently disappear past 100 rows).\nConvert them to listOrgScopedWithCount / listOrgScopedPage + PagerNav (see src/lib/db/resource.ts JSDoc), or add an annotated ALLOWLIST entry in ${rel(__filename)}:\n${summary}`,
    ).toEqual([]);
  });

  it("allowlist entries stay live (no rot: file gone or already converted)", () => {
    const stale = [...ALLOWLIST.keys()].filter((r) => {
      const abs = join(REPO_ROOT, r);
      if (!existsSync(abs)) return true; // file deleted/moved
      const txt = readFileSync(abs, "utf8");
      // Converted (has a marker) or no longer uses the capped helper.
      return !txt.includes(CAPPED_CALL) || MARKER_RE.test(txt);
    });
    expect(
      stale,
      `These ALLOWLIST entries no longer match a capped, marker-less page — remove them so the allowlist can't mask future regressions:\n  ${stale.join("\n  ")}`,
    ).toEqual([]);
  });
});
