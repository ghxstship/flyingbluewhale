# LEG3ND Deployment-Readiness Program

**STATUS: COMPLETE — goal condition met 2026-07-23 (pushed 13d97194).**
All 7 pillars landed; all 5 persona-matrix BLOCKERS closed (B-1 authoring,
B-2 live sessions, B-3 recert queue, B-4 store economy, B-5 certification
definitions) + the SHOULD set hardened (read-only floor, filtered nav,
consistent denial, crews joinable, badges earnable); 7 program migrations
applied (org chart, atom settings, doc-template settings, corpus links,
recert closure, store economy + achievement link, crew self-membership);
gate 199 files / 2107 tests / build 0; prod e2e 45/45 green post-deploy
(legend coverage+personas+deep+xmce+signage+onboarding-gate + compvss
deep). Deferred honestly: module grouping, course badge select (schema),
multi-assessment consumption, crew capacity (no column) — filed below.

**Goal (locked 2026-07-23):** LEG3ND full-stack deployment ready, all
workflows for every user role and persona type. Positioning source:
docs/marketing/MARKETING_ONBOARDING_REBUILD_PLAN.md (LEG3ND = the
Organization Master Hub on XPMS 2.5) + the gap analysis of 2026-07-23.

**Excluded (blocked on pricing sign-off):** plan selection/billing in
/start — LEG3ND is never paywalled per the pricing recommendation, so
deployment readiness does not depend on it.

## Pillars

| # | Pillar | Delivers |
|---|---|---|
| P1 | Org chart | positions.reports_to hierarchy + seat counts, person↔position assignments over the parties layer, chart visualization + assignment CRUD on the hub organization pillar |
| P2 | Template library | ONE hub library over all four template families (job, doc-registry, advance presets, field), org-level doc-template overrides (configurator v1: enable/disable + org defaults) |
| P3 | Branding studio | org + per-event/project brand kits with formalized inheritance (org → project → doc data-brand), live doc preview in the hub brand pillar |
| P4 | XPMS customization | org-facing atom-catalog surface (browse the 406-atom master catalog, org enable/label overrides), dim_department.app consumption v1 (app-ownership chips + filters in hub surfaces) |
| P5 | Knowledge grounding | event-scoped corpus sync: legend KB/SOPs → embedding sources per event (the Aurora grounding seam the positioning promises) |
| P6 | Persona coverage | L-recon matrix (PERSONA_MATRIX.md) = the acceptance fixture; every BLOCKER cell filled (expected: course authoring lifecycle, store admin, compliance-officer views, public verify polish) |
| P7 | Readiness | migrations applied via MCP, legend e2e extended to the matrix, full gate + worktree build + push + prod verification |

## Sequencing

L-recon + P1 launched first (matrix = acceptance fixture; org chart = the
deepest schema). P2-P5 run parallel (disjoint trees). P6 waves launch from
the matrix's BLOCKER list when L-recon lands. P7 closes. The COMPVSS Tier-1
agents run concurrently in disjoint lanes; the hub locations detail is
frozen until T1-5 lands (geofence admin).

## Definition of done (the goal's condition)

1. PERSONA_MATRIX.md shows zero BLOCKER cells (every persona's workflows
   EXIST with evidence).
2. All program migrations applied; types patched; full gate green
   (tsc · eslint · complete vitest); worktree build exit 0.
3. Legend e2e (coverage + personas + deep + xmce + signage + onboarding
   gate) green against the deployed prod.
4. Program recorded in memory; backlog deltas filed.
