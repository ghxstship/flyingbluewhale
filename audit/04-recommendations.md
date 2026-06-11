# Prioritized Recommendations — ATLVS UI/UX Backlog

Phase 4 of 4. Ranked backlog of 25 items derived from `02-internal-audit.md` (finding IDs) and `03-parity-matrix.md` (gap rows). Classification: **Parity** (catch up to ClickUp/SmartSuite/Odoo) · **Polish** (fix internal antipattern) · **Differentiation** (leapfrog — weighted toward gaps all three competitors share).

## Executive Summary

ATLVS's differentiation is real — portals, credentialing, advancing, offline field ops have no competitor equivalent — but every differentiated capability carries a defect that undermines it in production, starting with the flagship assignments surface being unreachable by clicking. The cheapest wins in this backlog are "wired but dead" features: bulk operations, field-level form errors, and the command palette are fully built and need only connection. Two Critical navigation fixes and three data-integrity fixes (truncated finance totals, the cents input trap, mobile actions crashing to error boundaries) should ship before anything else. The strategic risk is AI: all three competitors made agents-acting-on-records their 2026 headline while ATLVS's AI remains a chat panel — and the offline lead just shrank with Odoo 19.3's offline CRUD. Differentiation bets here therefore double down on what no competitor can copy quickly: show-day operations, scan telemetry, and persona-scoped portals. Roughly the top half of this list is S/M effort; a single focused cycle clears items 1–12. Effort scale: S ≤1 day · M ≤1 week · L ≤1 month · XL >1 month.

---

## Tier 1 — Critical Fixes (ship first)

**REC-01 · Open the door to the advancing flagship** — Polish · **S**
Link `/console/projects/[id]/advancing/assignments` from the Advancing tab (Doc Specs | Assignments sub-tabs) and add the asset-linker entry on the credentials list + palette. Resolves NV-1 (Critical) + NV-10. The platform's core differentiator is currently invisible to operators. No dependencies.

**REC-02 · Fix the command palette: flatten, repair, scope** — Polish · **S**
Flatten nav sections in the platform loop (3→128 routes indexed), fix the 404ing "Add Equipment" command, scope portal palette to the session persona. Resolves NV-2 (Critical), NV-4, NV-6. One file (`CommandPalette.tsx`). Prerequisite for REC-08.

**REC-03 · Stop computing finance totals from truncated pages** — Polish · **S**
Invoice header reduces over a 100-row cap → wrong money totals past 100 invoices (SC-3). Use `countOrgScoped` + SQL aggregates. Audit sibling subtitle-count islands for the same pattern.

**REC-04 · Kill the cents input trap on finance edit forms** — Polish · **S**
Invoice/expense edit forms take raw integer cents while create forms take dollars (FE-3) — a 100× error on revenue documents. Adopt `MoneyInput` + `dollarsToCents`, then sweep remaining raw money inputs (FE-7).

**REC-05 · Convert mobile server actions to the State pattern** — Polish · **M**
13 of 16 mobile actions throw, crashing the field PWA to a digest-masked error page on any failure (SC-1 High). Convert to `State` + FormShell. The single biggest reliability fix for COMPVSS, and a dependency of REC-13 (offline honesty) since hard failures currently masquerade as crashes.

## Tier 2 — Wired-but-Dead Capability (cheap parity)

**REC-06 · Render field-level form errors everywhere** — Polish · **S**
215 actions already return `fieldErrors`; make `ui/Input`/selects read `useFieldError(name)` as a context fallback — one edit lights up all 237 FormShell forms (FE-1 High). Also default `dirtyGuard: true` (FE-5).

**REC-07 · Wire bulk operations on the top three tables** — Parity · **M**
The complete bulk system (checkbox column, floating action bar) has zero consumers (FE-2). Wire assignments fulfillment transitions, invoice states, time-off approvals. All three competitors treat bulk edit as table stakes; for ATLVS it's also a show-day necessity (void 50 tickets). Depends on transition server actions accepting arrays.

**REC-08 · Global entity search in ⌘K** — Parity · **M**
The only Absent-everywhere-Present gap that's M-effort: an `/api/v1/search` endpoint (org-scoped, RLS-safe, across projects/people/invoices/assignments) feeding a palette group. Odoo ships NL search; ClickUp searches connected apps. Depends on REC-02.

**REC-09 · Honest pagination on growth tables** — Polish/Parity · **M**
Adopt `listOrgScopedPage` (the audit page is the template) on time_entries, expenses, assignments, notifications; render "showing first N" whenever `rows.length === limit`; fix the unbounded `listProjects` (SC-2, SC-8, PF-6). Without this, DataTable search silently lies about row 101+.

**REC-10 · Centralize lifecycle tone maps + complete StatusBadge** — Polish · **M**
144 duplicate `*_TONE` maps and same-state-different-color bugs (CN-1/2/3, F7/F8 of consistency audit). Export canonical maps per lifecycle from `src/lib/tones.ts` (marketplace is the template), sync StatusBadge with `FULFILLMENT_STATES`, add an enum-coverage test, lint-ban local tone consts. Unifies the badge idiom (CN-7/8).

## Tier 3 — High-Value UX Repairs

**REC-11 · Fix chat: pagination direction, optimistic send, scroll anchor** — Polish · **M**
Rooms past 200 messages never show new messages (PF-1); send has no pending state, double-submits, opens scrolled to the oldest message (PF-3); every realtime event re-renders the whole page (PF-5). Client island with `useOptimistic` + client-side row append. The highest-frequency mutation in the app.

**REC-12 · Debounce URL-synced table search** — Polish · **S**
Per-keystroke `router.replace` = full RSC round-trip per character on force-dynamic pages (PF-2 High). ~300ms debounce or shallow history for table-view keys in `useUrlState`.

**REC-13 · Make the offline banner tell the truth — then widen the queue** — Differentiation · **M**
Banner promises everything queues; only 4 endpoints do (SC-4). Step 1: scope the copy + disable non-queueable submits offline. Step 2: route high-value mobile mutations (time-off, daily logs, incidents) through queueable API endpoints. Defends the offline moat Odoo 19.3 is now attacking; ClickUp/SmartSuite still can't save offline at all. Depends on REC-05.

**REC-14 · Undo toast on soft-deletes** — Parity · **S**
69 tables are soft-deletable with zero UI undo (FE-6). Sonner is already mounted; add `toast` + restore action to DeleteForm's success path. SmartSuite ships recycle-bin restore; this is cheaper and more visible.

**REC-15 · Accessibility repair bundle** — Polish · **M**
Fix the broken skip link/duplicate `id="main"` (AX-1), FormField `htmlFor` + aria-describedby wiring then re-enable the lint rule (AX-2 — 697 unbound labels), portal `<main>` landmark (AX-4), `--p-focus` token for the failing COMPVSS/GVTEWAY focus rings (AX-3), `::selection` contrast (AX-8). One sprint, mostly in 4 files + tokens.

**REC-16 · Permission-denied surfaces in the console** — Polish · **M**
RLS-empty is indistinguishable from truly-empty and invites doomed create actions (SC-5). Add `can()` gates in finance/settings module layouts with an explicit access surface, mirroring the API layer's exemplary 403 envelopes. SmartSuite's admin "View As" is the parity benchmark.

**REC-17 · Breadcrumbs by default + record-tab overflow** — Polish · **M**
Derive crumbs from the route tree in ModuleHeader (slot exists, 14% adoption — NV-9); implement the documented-but-missing `More ▾` overflow for the 13-tab project record (NV-8); fix greedy root active-states (NV-7). Wayfinding parity with every competitor's persistent breadcrumb trail.

**REC-18 · Cross-shell URL canon enforcement** — Polish · **S**
20 raw cross-shell hrefs 404 in subdomain mode and send external personas into the console (NV-3 High). Sweep to `urlFor` + add a lint/test rule (the url-canon test exists — extend it to JSX hrefs).

## Tier 4 — Structural Parity

**REC-19 · Per-module loading states with matching skeletons** — Polish · **S**
Add `loading.tsx` to finance, projects/[id], marketplace, workforce segments using the shipped-but-unused `table`/`form`/`detail` variants (SC-6/PF-7); propagate the dual-Suspense streaming exemplar from the projects/invoices pages.

**REC-20 · Optimistic updates on high-frequency toggles** — Parity · **M**
0 `useOptimistic` repo-wide (PF-4); notifications inbox, settings switches, kanban already has the pattern locally. Also: Sentry capture in shell error boundaries (SC-7), Combobox stale-response guard (PF-8), StatusForm adoption for the 104 raw forms (FE-8).

**REC-21 · Adopt-or-delete the orphan primitives + select decision** — Polish · **M**
174 raw `<select>` files vs a zero-adopter `ui/Select`; 5 zero-usage primitives; 65 local micro-primitives (CN-4/5/10). Decide canon per primitive, codemod the top 10 forms, delete the rest. Stops the design system advertising components nobody uses.

**REC-22 · Replace the guides JSON textarea with a structured editor** — Parity · **L**
The Boarding Pass CMS — a guest-facing differentiator — is edited as raw JSON with no autosave, draft, or dirty guard (FE-4). Section-based form editor with per-section preview, draft autosave to `event_guides`, JSON mode retained for power users. SmartSuite's multi-page form builder is the UX benchmark.

## Tier 5 — Differentiation Bets (gaps all three competitors share)

**REC-23 · Show-Day Command Center** — Differentiation · **XL**
A per-project live-ops dashboard composing what ATLVS uniquely has: real-time scan throughput by gate (assignment_events), credential/ticket fulfillment funnels (v_catalog_inventory), open incidents, shift coverage, weather/timeline context — with the interactive filter-widget pattern SmartSuite is converging toward. No competitor can build this because none has the scan/credential/crew substrate. Subsumes the generic "user-composable dashboards" parity gap by shipping the opinionated domain version first. Depends on REC-07 (bulk transitions surface here) and REC-09.

**REC-24 · Offline-first show kit** — Differentiation · **L**
Precache the authenticated /m app shell + the active project's rosters, assignments, and guides at shift start; offline.html lists cached surfaces and the pending queue (SC-10). Marketing claim becomes "the only platform that runs a gate with zero bars." ClickUp/SmartSuite cannot follow without re-architecture; Odoo's 2 GB offline mode has no domain payload. Depends on REC-13.

**REC-25 · AI that acts on org records** — Parity→Differentiation · **XL**
The one Absent that compounds: ClickUp Super Agents, SmartSuite AI Field Agents, and Odoo agents all act on records; ATLVS AI chats. The LDP lifecycle schema is unusually suited to safe agentic actions — every transition is enum-guarded server-side (`NEXT_FULFILLMENT_STATES`), giving a natural permission-aware action surface ("advance these 12 credentials to issued", "draft the artist guide from the rider"). Start with read-grounding (AI answers from org data via RLS-scoped queries), then guarded transitions with human confirm. Differentiation comes from domain verbs, not the agent runtime.

---

## Sequencing Notes

- **Tier 1 + REC-06/12/14/18/19 are a single hardening cycle** (~9 S/M items, no interdependencies beyond REC-02→08 and REC-05→13).
- REC-10 (tone canon) should land before REC-23 (command center) so the new surface is born on canonical colors.
- REC-07 + REC-09 + REC-10 together make the assignments table the reference list implementation — do them as one workstream against the same surface REC-01 just exposed.
- REC-25 is deliberately last despite strategic weight: its value is gated on the data-integrity and navigation fixes above (an agent acting on records is only as trustworthy as the surfaces that display them).
- Out of scope by design: custom fields / no-code app building (Absent in matrix). ATLVS's fixed LDP-governed schema is a deliberate trade; revisit only if sales friction proves otherwise.
