# Empty-State Audit

Audit of every blank-slate / zero-state surface in the ATLVS console, portal,
mobile, and personal shells, measured against leading-SaaS empty-state best
practice. Generated 2026-06-06.

## Best-practice rubric

A first-class empty state (Linear / Stripe / Attio / Notion convention) has:

1. **Clear Title Case title** — names the missing thing, not "No records".
2. **One sentence of guidance** — what this surface holds + how the first record arrives.
3. **A primary CTA** — a button that creates the first record (or, on read-only
   surfaces, points at where the data originates).
4. **An icon or illustration** — visual anchor so the pane never reads as broken.
5. **Optional secondary link** — "Learn more" / a related destination.
6. **Never a blank dead-end** — no bare pane, no lone em-dash row, no terse label.

## How empty states are wired in this codebase

- `src/components/ui/EmptyState.tsx` — the canonical primitive. It **already**
  supports every rubric affordance: `title`, `description`, `action`,
  `secondaryAction`, `icon`, `illustration`, and a `size="default" | "compact"`
  switch. The default size renders icon + title + description + actions; compact
  is the inline section variant. Default icon is `<Inbox/>`. **No component
  change was required** — the gap is entirely in how _callers_ feed it.
- `src/components/DataTable.tsx` — the list/table workhorse. When `rows.length === 0`
  it renders `DataTableEmpty`: structure-preserving ghost rows (dashed, 30% opacity,
  em-dash cells) behind a centered `<EmptyState size="compact">`. It accepts
  `emptyLabel` (→ title), `emptyDescription` (→ description), and `emptyAction`
  (→ action). **A page that passes only `emptyLabel` gets a terse title with no
  guidance and no CTA** — the WEAK pattern.
- `src/components/DataTableInteractive.tsx` — the client island the server table
  hydrates into. Its own zero branch (line ~597) is a bare
  `<div>{emptyLabel}</div>`, but it is only reachable as a fallback because the
  server `DataTable` intercepts the empty case first.

## Inventory & counts

| Signal                                                                                               | Count                  |
| ---------------------------------------------------------------------------------------------------- | ---------------------- |
| Files rendering `<EmptyState …>` directly                                                            | 144 files / 165 usages |
| Pages passing `emptyLabel` to a DataTable                                                            | 199                    |
| …of those **with** `emptyAction` (full CTA) — GOOD                                                   | 98                     |
| …of those **without** `emptyAction`                                                                  | 101                    |
| Pages with `emptyLabel` + no `emptyAction` + no top-level `<EmptyState>` guard — **WEAK**            | 90                     |
| Pages with `emptyLabel` + **no description, no action, no EmptyState** — **MISSING-grade dead-ends** | 12                     |
| Hard-coded inline "No X yet" paragraphs bypassing EmptyState entirely                                | ~6 components          |

### Category definitions

- **GOOD** — full `<EmptyState>` (icon + Title Case title + guidance + CTA),
  whether rendered directly with a `projects.length === 0` guard (e.g.
  `console/projects`, the gold-standard pattern) or via DataTable
  `emptyLabel` + `emptyDescription` + `emptyAction`. ~98+ surfaces.
- **WEAK** — a DataTable empty that surfaces a terse title and (often) a
  description that leaks raw route paths or table names, but **no CTA inside the
  empty state**. The user sees ghost rows + a sentence and has to hunt the header
  for the create button. 90 pages.
- **MISSING** — a bare `emptyLabel` only: one short line, no guidance sentence,
  no CTA, no fallback `<EmptyState>`. Reads as a near-dead-end. 12 surfaces
  (9 pages + 3 chart/calendar islands).

### Note on false positives

A bare `emptyLabel` is **not** automatically a defect. The canonical pattern
(`console/projects/page.tsx`) guards `rows.length === 0` with a full
`<EmptyState>` _above_ the table, leaving the table's `emptyLabel` unreachable.
Those pages are GOOD. The 90 WEAK / 12 MISSING counts exclude every page that
has such a guard (they were filtered on "no `EmptyState` import present").

## Worst ~15 offenders (by route, before fix)

Ranked by traffic × severity. ✦ = fixed in this pass.

| #    | Route                          | Problem                                                                             |
| ---- | ------------------------------ | ----------------------------------------------------------------------------------- |
| 1 ✦  | `p/[slug]/client/invoices`     | Client-facing. Bare "No invoices yet" — no guidance, no context.                    |
| 2 ✦  | `p/[slug]/client/proposals`    | Client-facing. Bare "No proposals to review".                                       |
| 3 ✦  | `p/[slug]/client/deliverables` | Client-facing. Bare "No deliverables yet".                                          |
| 4 ✦  | `console/safety/incidents`     | Core safety list. Bare "No incidents in the last 30 days" — no description, no CTA. |
| 5 ✦  | `console/venues`               | Core list. Has description but lowercase title + no CTA.                            |
| 6 ✦  | `console/subscriptions`        | Has description but no CTA; lowercase title.                                        |
| 7 ✦  | `console/bookings/deals`       | Description leaks `talent_offer` + raw route; no CTA.                               |
| 8 ✦  | `console/comms/announcements`  | Description leaks `/m/feed`; lowercase title; no CTA.                               |
| 9 ✦  | `console/workforce/courses`    | Description leaks "via /m/learning"; lowercase title; no CTA.                       |
| 10 ✦ | `console/agency/roster`        | Description is SQL-speak ("Add an active agency_artist row"); no CTA.               |
| 11   | `console/people/offer-letters` | Roster-seeded; OK title + description, no CTA (acceptable — no direct create).      |
| 12   | `console/people/msas`          | Bare-ish label; lower priority.                                                     |
| 13   | `console/procurement/itb`      | Bare label; lower priority.                                                         |
| 14   | `console/finance/periods`      | Bare label; lower priority.                                                         |
| 15   | `console/safety/osha`          | Filtered-by-year compliance log; bare label acceptable in context.                  |

Non-page islands also worth noting (different shape, lower priority): the
`emptyLabel`-only branch in `programs/risk/RiskHeatmap.tsx`,
`sustainability/carbon/CarbonCharts.tsx`, and `schedule/ScheduleCalendar.tsx`;
and hand-rolled inline empties in `components/share/ShareDialog.tsx`,
`components/ConversationPanel.tsx`, `components/automations/StepBuilder.tsx`,
`components/workspace-chrome/DashboardsMenu.tsx`,
`components/ldp/LdpStateTimeline.tsx`.

## Verdict

The shared `EmptyState` primitive is already best-in-class — nothing to add. The
problem is **adoption inconsistency in the DataTable layer**: roughly half of all
list pages stop at a terse `emptyLabel`, and a chunk of those leak engineer-facing
strings (raw route paths, table/column names, parenthetical asides) into
user-visible copy. The highest-value, lowest-risk fix is to push a **primary CTA
into the empty state** of high-traffic core lists and to **rewrite the leaked
descriptions as human guidance** — which this pass does for the 10 worst
offenders (rows 1–10 above).

## Fixes applied in this pass

See the companion commit. Ten surfaces upgraded to the full rubric:

- **3 client-portal reads** (`invoices`, `proposals`, `deliverables`) — Title
  Case titles + a guidance sentence explaining what will appear and that it is
  pending the producer. Read-only surfaces, so no create CTA (per rubric, the
  CTA is optional on consumer surfaces).
- **7 console lists** (`safety/incidents`, `venues`, `subscriptions`,
  `bookings/deals`, `comms/announcements`, `workforce/courses`, `agency/roster`)
  — Title Case titles, human-rewritten guidance with no leaked routes/table
  names/parentheses, and a primary `emptyAction` CTA button mirroring the header
  create action.
