# Workflow & CRUD Efficiency Audit

> **STATUS: ✅ REMEDIATED (2026-06-18)** — branch `feat/workflow-remediation`.
> | Finding | Action | Result |
> |---|---|---|
> | **F-A** ⌘K quick-create (6/100) | Auto-generate the Create registry from every `/console/**/new` route (generator + guard test) | **132 quick-creates** — every dataset is ~2 keystrokes |
> | **F-B** project gated behind selection | `ProjectSwitcher` (searchable) on every project surface, preserves the tab | hop projects in 1 action |
> | **F-C** 12 second-class datasets (~4 clicks) | Promoted 10 to module sub-nav (2 left hub-linked by design) | **DEEP 27→17** |
> | **F-D** breadcrumbs on deep surfaces | Verified `DerivedBreadcrumbs` in `ModuleHeader` already covers them (audit false-negative) | already shipped |
> | **F-E** incidents split | Repointed nav "Incidents" → the canonical CRUD home (`operations/incidents`) | one obvious create/manage home |
> | **F-F** prequalification drill-in (de-linked in SEA TRIAL) | Built the `[prequalId]` detail + restored `rowHref` | rows drillable again |
>
> Remaining DEEP/NESTED are **inherently record-nested** (`parent/[id]/child`) — addressed by the wayfinding stack (breadcrumbs + project switcher + ⌘K create), not by promotion. **Deferred (documented, not built):** a `sprints` detail view (manageable inline today) and a product confirm-intent pass on the by-design NO-CREATE/READ-ONLY surfaces (triaged in §F-F below). Gate: tsc · 738 tests · build all green.

**Date:** 2026-06-18 · **Scope:** business-logic / workflow friction across the route surface, focused on click-cost to execute CRUD for every dataset.
**Method:** static route-graph analysis (`scripts/workflow-audit.mjs`) over `docs/ia/SITEMAP.md` + `src/app` + sibling `actions.ts`, cross-referenced with `src/lib/nav.ts` (what's directly clickable). **220 datasets** (resources with CRUD routes) analyzed across console / mobile / portal / `/me`. This is a *structural* audit (route depth + CRUD-verb presence + nav reachability), not a moderated usability test — treat "REVIEW-INTENT" flags as candidates, "CONFIRMED" as objective.

## Click model

From an authed landing, a **directly nav-linked list = 2 clicks** (open rail group → click item). Each path level a dataset sits *below* its nearest nav-linked ancestor adds ~1 click (you navigate into the parent first). CRUD then adds: **create** = reach + 1 (New) · **read** = reach + 1 (row) · **update** = detail + 1 (Edit) or inline · **delete** = detail + 1 + confirm. **Intuitive bar:** a primary CRUD op should be *initiable* in ≤3 clicks.

## Scorecard

| Signal | Count | Confidence |
|---|---:|---|
| Datasets analyzed | 220 | — |
| **DEEP** — ≥4 clicks just to reach the list | **27** | CONFIRMED (objective) |
| **NESTED** — ≥3 path levels below the shell | 28 | CONFIRMED |
| Unreachable from nav | **0** | ✅ (nav reconciliation landed earlier) |
| NO-DRILL-IN — list+create, no row detail/edit | 25 | REVIEW-INTENT |
| NO-CREATE — detail but no create route/action | 24 | REVIEW-INTENT (mostly by-design) |
| READ-ONLY — detail, no update/delete found | 36 | LOW (over-reports inline/transition actions) |
| ⌘K global quick-create coverage | **6 / ~100** creatable | CONFIRMED gap |

---

## Headline findings (prioritized)

### F-A · Global quick-create is built but barely populated — **S1, high leverage**
The command palette (⌘K) already supports instant create — but only **6** datasets: New Project, Client, Invoice, PO, Proposal, Add Equipment (`src/components/CommandPalette.tsx:186`). The other **~90 creatable datasets** require full navigation (2–6 clicks) to their `/new`. This is the single highest-leverage fix: every dataset has a `/new` route, so the ⌘K create registry can be **auto-derived from the route inventory** (same SSOT pattern as the sitemap generator) — turning *every* create into a 2-keystroke action regardless of nav depth.
**Remediation:** generate the ⌘K "Create…" group from all `/<resource>/new` routes (label from nav/route, group by domain); for project-scoped creates, prompt a project picker inline. Collapses create-cost to ~constant for all 100 datasets.

### F-B · Project execution is gated behind project-selection — **S1**
**20 sub-surfaces** live under `/console/projects/[projectId]/*` (advancing, budget, crew, tasks, schedule, sprints, tracker, files, photos, stage-plots, guides, sustainability, …). Reaching any is **≥4 clicks** (Projects → pick project → tab → …), and their sub-resources are worse: **`…/advancing/assignments` = ~5 clicks, `…/advancing/assignments/new` = ~6**. There is no cross-project entry for these and no quick-create. A daily operator managing assignments/tasks across shows pays this tax constantly.
**Remediation:** (1) cross-project work views for the high-frequency ones (a global Assignments / Schedule / Tasks already exist at `/console/{tasks,schedule}` — extend the pattern to advancing/assignments, scoped+filterable by project); (2) a persistent "current project" switcher + breadcrumbs so tab-hopping within a project is 1 click, not a re-drill; (3) project-scoped entries in the ⌘K create (F-A).

### F-C · "Second-class" operational datasets — ~4 clicks via hub-drilling — **S2**
These are depth-2 datasets that are **not in the rail** (reachable only via an in-page link from a module hub), so they cost ~4 clicks despite being shallow:
`safety/environmental`, `safety/threats`, `safety/guard-tours`, `safety/major-incident`, `finance/entities`, `finance/mileage`, `finance/cost-codes`, `production/dispatch`, `participants/entries`, `procurement/po-change-orders`, `procurement/wo-broadcasts`, `agency/roster`.
**Remediation:** promote the high-frequency ones to a module **sub-nav** (a `NavSection` under their domain group, per Miller — don't bloat the top rail) or a hub landing with first-class tiles. Low-frequency config tables can stay hub-linked.

### F-D · Inherently-nested record sub-resources — 4–5 clicks, no breadcrumb — **S2**
Record-scoped children that are deep by nature but lack wayfinding: `marketplace/calls/[id]/submissions`, `marketplace/postings/[id]/applicants`, `marketplace/talent/[id]/riders`, `procurement/rfqs/[id]/responses`, `procurement/requisitions/[id]/leveling`, `forms/[id]/submissions`, `ai/automations/[id]/runs`, portal `client/proposals/[id]/{approvals,change-orders,revisions}`. These are acceptable *in-context*, but the deep reach + no breadcrumbs makes return-trips costly.
**Remediation:** breadcrumb trails on every `[id]/*` surface + "back to parent" affordance; surface child counts on the parent detail so the user knows what's there before drilling.

### F-E · One dataset, several entry points — **S2 (consolidation)**
`incidents` has **three surfaces**: `/console/safety/incidents` (view — its "New" links to a *different* path), `/console/operations/incidents/*` (the actual create/CRUD), and mobile `/m/incident` + `/m/incidents`. Functional, but the split (safety view vs operations CRUD) is non-obvious and was the cause of a false "NO-CREATE" flag. Similar duplication risk: marketplace publish controls vs public listings.
**Remediation:** pick one canonical CRUD home per dataset; make the others clearly-labeled filtered views (or redirect). Document the canonical home.

### F-F · CRUD-route asymmetries — **S3, triage**
- **NO-DRILL-IN (25):** mostly simple lookup/config tables managed inline (cost-codes, campaigns, captures, warranties, forecasts, payroll, wip, recognition, inspection templates) + mobile quick-file surfaces (`/m/incident`, `/m/medic`, `/m/time-off`) — **acceptable as-is**. Worth a detail view only where the record is rich: `procurement/prequalification` (+ `questionnaires`) and `projects/[id]/sprints` (detail routes don't exist; prequalification rows were de-linked in the SEA TRIAL to avoid 404s — building the detail is the proper follow-up).
- **NO-CREATE (24):** overwhelmingly **by-design** — computed/read-only surfaces (`reports`, `workforce/forecast`, `xpms/classes`, `proposals/templates`, `pipeline`) and generated documents (`offer-letters`). No action needed beyond confirming intent.
- **READ-ONLY (36):** low-confidence (the detector misses status-transition / publish / client-component actions). Spot-check the genuinely view-only ones for a missing edit affordance; most are dashboards/viewers by design.

---

## Remediation backlog (by impact × effort)

| # | Item | Sev | Effort | Payoff |
|---|---|---|---|---|
| 1 | **Auto-generate the ⌘K "Create…" group from every `/new` route** (F-A) | S1 | M | Create-cost → ~2 keystrokes for all ~100 datasets |
| 2 | **Project switcher + breadcrumbs** across `/console/projects/[id]/*` (F-B) | S1 | M | Cuts the most-trafficked workflow from re-drill to 1 click |
| 3 | Cross-project views for advancing/assignments (extend the `/console/tasks` pattern) (F-B) | S2 | M–L | Removes project-gating for daily ops |
| 4 | Promote ~12 second-class datasets to module sub-nav (F-C) | S2 | S | 4 clicks → 2 for real operational surfaces |
| 5 | Breadcrumbs + child-counts on all `[id]/*` record sub-resources (F-D) | S2 | S | Wayfinding on 15+ deep surfaces |
| 6 | Consolidate the incidents surfaces (one canonical CRUD home) (F-E) | S2 | S | Removes a genuine "where do I create this?" |
| 7 | Build detail views for `prequalification` (+questionnaires) & `sprints` (F-F) | S3 | M | Restores drill-in (and the de-linked rows) |
| 8 | Confirm-intent pass on NO-CREATE / READ-ONLY candidates (F-F) | S3 | S | Closes any real read-only gaps |

## Method caveats

- Static route + action-grep analysis: **READ-ONLY** over-reports (misses inline/client/transition actions) and **NO-CREATE** includes intentional computed surfaces — both are REVIEW-INTENT, not defects. **DEEP/NESTED/⌘K-coverage are objective.**
- Click counts are nav-graph estimates (group+item = 2), not instrumented; directional, not exact.
- Re-run anytime: `node scripts/workflow-audit.mjs` → `docs/audits/workflow-audit.json`.
