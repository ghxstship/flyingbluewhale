# Sitemap Reconciliation Plan

**Status:** ✅ EXECUTED · 2026-06-17
**Owner:** Julian × Claude
**SSOT:** [`SITEMAP.md`](./SITEMAP.md) (generated — `npm run gen:sitemap`)
**Goal:** drive the gap between **what exists on disk** and **what the navigation IA exposes** (`src/lib/nav.ts`) to a known, intentional, guarded state.

> **Outcome (all phases done).** Rail + self-nav shells fully reconciled:
> **0 orphans · 0 dangling nav · 0 dead priority refs**, guarded by
> `src/lib/ia/sitemap.test.ts` (runs in pre-push). Decisions executed:
> **D1** XPMS → LEG3ND/Knowledge lens (paths kept at `/console/xpms` so the
> legend airport-signage skin isn't imposed on WBS admin); **D2** Assistant →
> Dashboard group; **D3** `/m/schedule` vs `/m/shift` kept (NOT a dup — events
> calendar vs workforce roster, 3NF-distinct), surfaced `/m/schedule` as
> "Calendar"; **D4** `/p/[slug]/overview` deleted (no redirect); **D5** self-nav
> consolidation done now. **No backwards-compat / legacy / redirects** anywhere.

---

## 1. Why this exists

The route surface grew faster than the nav. Pages get scaffolded (`scripts/generate-stubs.sh`) and built out, but wiring them into `src/lib/nav.ts` is a separate, easily-skipped step. The result: real, recently-shipped features that **no user can navigate to** — invisible unless you know the URL. Conversely, nav can point at pages that don't exist (dead links).

Neither drift was previously measured. [`SITEMAP.md`](./SITEMAP.md) now measures both, on every run, from the two sources of truth (filesystem + `nav.ts`). This plan is the backlog that closes the gap and the guard that keeps it closed.

## 2. State — before → after

| Metric | Before | After |
|---|---:|---:|
| Page routes on disk | 1,084 | 1,083 _(deleted `/p/[slug]/overview`)_ |
| API route handlers | 124 | 124 |
| ● Directly nav-linked | 335 | **403** |
| ○ Reachable (CRUD / in-page / dynamic child / `[role]` re-export) | 588 | **646** |
| ⚠ **Orphan** (rail shells, pre) → **all shells** (post) | **24** (10 modules) | **0** ✅ |
| · Exempt (intentional non-nav, with reasons) | 2 | **33** |
| – Self-nav shells (unmeasured) | 135 | **0** _(now reconciled)_ |
| 🔗 Dangling nav (link → no page) | **0** ✅ | **0** ✅ |
| 🪫 Dead priority refs (COMPVSS drawer) | **2** | **0** ✅ |

Reconciliation now covers **all six shells**. The three rail shells (ATLVS `/console`, COMPVSS `/m`, GVTEWAY portal `/p/[slug]`) source nav from the `nav.ts` rails; marketing + `/me` source theirs from the new `nav.ts` exports their components consume (Phase 4). The 33 exempt routes are token/auth/locale/microsite flows, each recorded with a reason in `EXEMPT` (and rendered in `SITEMAP.md`).

## 3. Principles (inherited from the IA canon)

These constrain every change below. They come from `02-navigation-redesign.md`, `03-ia-compression-proposal.md`, and the ADRs.

1. **URLs are stable. Only grouping + labels move.** Reconciling nav means adding/moving `NavItem`s — never renaming routes. (`03-ia-compression-proposal.md`: "URL scheme stays.")
2. **Miller's 5–9 per group.** Don't blow a group past ~9 items. If a domain needs a 10th, add a `NavSection`, don't append.
3. **Recognition over recall.** A feature that exists must be reachable by clicking, not by typing a URL. Orphans violate this by definition.
4. **One mental model across tiers.** Role-gating (`minRole`) changes *visibility*, never the *shape*.
5. **Every orphan gets a disposition.** Three valid outcomes: **(a) wire into nav**, **(b) consolidate** into an existing surface, or **(c) exempt** as intentional infra (redirect/gateway) — recorded in the generator's `EXEMPT` map. "Leave it floating" is not an outcome.

## 4. Phased backlog

### Phase 0 — Lock the SSOT ✅

- [x] `scripts/generate-sitemap.mjs` — generates `SITEMAP.md` from filesystem ⨯ `nav.ts` (modes: write / `--check` / `--json`).
- [x] `npm run gen:sitemap` / `gen:sitemap:check` (mirrors the `gen:theme` SSOT pattern).
- [x] Superseded `02-route-inventory.md` + stale `inventory/sitemap-workflow-inventory.*`.
- [x] **Drift guard in CI/pre-push** — `src/lib/ia/sitemap.test.ts` runs `--check` (staleness) + `--json` (zero-orphan) inside the vitest suite, which pre-push already runs. Same pattern as `tokens-contract.test.ts` guarding `gen:theme`.

### Phase 1 — ATLVS console orphans ✅ (16 routes, 4 modules)

All four are **live, recently-touched features** (173–327 LOC, last edited 2026-06-07…14), not debris. Disposition = wire into nav.

| Module | Routes | What it is | Recommended home | Decision? |
|---|---:|---|---|---|
| `xpms` | 9 | WBS / atoms / codebook / phases / tiers / provenance / variance — the XPMS protocol admin (the `xpms_phase` lifecycle SSOT) | **Projects ▸ Governance** new item "Work Breakdown (XPMS)", _or_ **Knowledge** (it's reference-shaped) | ⚠️ **yes** — Projects vs Knowledge |
| `dashboards` | 3 | Custom dashboard builder (`/[id]`, `/[id]/edit`) | **Dashboard** group → add "Dashboards" (next to Overview/Reports/Goals) | no |
| `assistant` | 2 | End-user AI assistant chat (`/[conversationId]`) — distinct from the `/console/ai/*` ops items, which live in **`settingsNav`** (admin config: Automations / Field Agents / RAG Corpus) | A user chat doesn't belong in Settings. Put "Assistant" in the **Dashboard** group, or route it through ⌘K (per `03-ia-compression-proposal.md`, "AI collapses into ⌘K") | minor — placement |
| `pipeline` | 2 | Sales pipeline / deals kanban (`/[dealId]`) | **Sales ▸ Pipeline & Partners** → add "Pipeline" | no |

Each is a one-line `NavItem` insert in `src/lib/nav.ts`. After: `npm run gen:sitemap` → ATLVS orphans → 0.

### Phase 2 — COMPVSS orphans + dead priority refs ✅ (8 routes)

The two dead priority refs (`/m/guide`, `/m/incident`) and three of the orphans are the **same root cause**: surfaces referenced by intent but never registered in `mobileSurfaces`, so `mobileSurfacesForRole()` filters them out (`byHref.get()` miss).

| Route(s) | What it is | Action |
|---|---|---|
| `/m/incident`, `/m/incident/new` | "My Incidents" + quick-file (per CLAUDE.md, distinct from the `/m/incidents` org queue) | **Add to `mobileSurfaces`** → fixes orphan **and** the `ROLE_PRIORITY_HREFS.guard` dead ref |
| `/m/guide` | Mobile Boarding Pass / event guide | **Add to `mobileSurfaces`** → fixes orphan **and** the `ROLE_PRIORITY_HREFS.performer` dead ref |
| `/m/tasks`, `/m/tasks/[taskId]` | Field task list + detail | **Add to `mobileSurfaces`** |
| `/m/schedule` | Standalone schedule | **Investigate dup vs `/m/shift`** — fold/redirect, or add if distinct | ⚠️ decision |
| `/m/inventory/scan` | Inventory scan tool | Fold under `/m/wms` (Warehouse) as a sub-tool link, or add "Inventory Scan" | minor |

Guardrail: after adding entries, confirm each `ROLE_PRIORITY_HREFS`/`PHASE_PRIORITY_HREFS` href resolves (the generator's "dead priority refs" count → 0).

### Phase 3 — GVTEWAY portal ✅ (1 route, deleted)

| Route | What it is | Action |
|---|---|---|
| `/p/[slug]/overview` | Duplicate of the persona-gateway concept; `portalNav` "Overview" points at the persona base (`/p/[slug]/[persona]`), not `/overview` | **Investigate** — almost certainly a stale duplicate of the `/p/[slug]` gateway. Either delete, or repoint the nav "Overview" item to it. | ⚠️ decision |

`/p/[slug]` and `/p/select` are already recorded as intentional `EXEMPT` infra (persona routing) — no action.

### Phase 4 — Self-navigating shells ✅ (marketing / auth / `/me`)

These were a **second, unmeasured SSOT** — nav embedded in `MarketingHeader.tsx`, the marketing `layout.tsx` footer, and the `(personal)/layout.tsx` tabs. Now centralized:

- [x] Extracted the link data into `nav.ts`: `marketingHeaderGroups`, `marketingHeaderPrimaryLinks`, `marketingAuthLinks`, `marketingFooterGroups`, `personalNavGroups` (i18n `labelKey`s preserved verbatim — not one rendered string changed).
- [x] Pointed `MarketingHeader.tsx`, the marketing footer, and the `/me` tabs at those exports (they now `.map()` the shared data).
- [x] Extended the generator to harvest these exports; all shells are reconciled (no `selfnav` exemption left). The few genuinely non-nav routes (token/auth/locale/microsite) are in `EXEMPT` with reasons.

_Note: `AvatarMenu.tsx` is the global account entry point (`/me`, `/me/preferences`, `/console/settings`, `/help`) — a deliberate subset, not the `/me` nav; the full `/me` surface is `personalNavGroups`. Left as-is._

_Larger; do after Phases 1–3 prove the loop. Until then, these 135 routes are inventoried but unverified for reachability._

### Phase 5 — Deep-linked audit (optional, ongoing)

588 routes are "○ linked" — their module is navigated, but the specific leaf is reached via in-page UI. Most are normal CRUD children. A spot-audit should confirm there's no **know-the-URL-only** sub-feature (a tab/section with no on-page entry point). Low priority; sample per domain rather than exhaustively.

### Phase 6 — Institutionalize ✅

- [x] **Orphan ratchet test** — `src/lib/ia/sitemap.test.ts` asserts `orphan === 0`, `orphanModules === 0`, `dangling === 0`, `deadPriority === 0`, plus a `--check` staleness gate. Green now; guards regressions (same pattern as `tokens-contract.test.ts`).
- [x] **CLAUDE.md pointer:** `nav.ts` SSOT note + `docs/ia/SITEMAP.md` added under Conventions ▸ Nav.
- [x] **PR template** — added `.github/pull_request_template.md` (the repo uses PRs + CI + merges, so a template is the expected community-health file). Includes the nav/sitemap line plus LDP / brand / URL / docs reminders. The sitemap rule is also hard-enforced by the ratchet test.

## 5. Decision register — RESOLVED

| # | Decision | Resolution |
|---|---|---|
| D1 | `/console/xpms` home | **LEG3ND / Knowledge lens** — added as "The Protocol (XPMS)" section in the Knowledge group; paths stay `/console/xpms` (not moved under `/console/legend/*`, which would impose the airport-signage skin on WBS admin). |
| D2 | `/console/assistant` placement | **Dashboard group** (per current SaaS norms — assistant is a persistent top-level surface, not buried in Settings with the AI ops config). |
| D3 | `/m/schedule` vs `/m/shift` | **Both kept** — investigated: distinct domains (events `CalendarView` vs workforce `ScheduleSurface`/clock), 3NF-clean, both standard in field-ops SaaS. Surfaced `/m/schedule` as "Calendar". |
| D4 | `/p/[slug]/overview` | **Deleted** (no redirect); sr-only skip link repointed to the `/p/[slug]` gateway. |
| D5 | Phase 4 scope | **Done now** — self-nav fully centralized + reconciled. |

### (historical) original register

| # | Decision | Options | Default if no call |
|---|---|---|---|
| D1 | `/console/xpms` home | Projects ▸ Governance · Knowledge | Projects ▸ Governance |
| D2 | `/console/assistant` placement | Dashboard group · ⌘K only | Dashboard group |
| D3 | `/m/schedule` vs `/m/shift` | dedupe/redirect · keep both | investigate, lean dedupe |
| D4 | `/p/[slug]/overview` | delete · repoint nav | delete (stale dup) |
| D5 | Phase 4 scope | do now · defer | defer |

## 6. Acceptance criteria

- `npm run gen:sitemap:check` is green and wired into CI (Phase 0).
- Rail-shell orphan count = **0** (Phases 1–3), every former orphan either nav-linked or in `EXEMPT` with a reason.
- Dangling nav = 0 (already) and dead priority refs = 0 (Phase 2).
- Orphan ratchet test landed and green (Phase 6).
- `SITEMAP.md` regenerated and committed in the same PR as any route/nav change.

## 7. Effort

| Phase | Effort | Risk |
|---|---|---|
| 0 — guard wiring | XS | none |
| 1 — ATLVS (4 nav inserts) | S | none (additive) |
| 2 — COMPVSS (`mobileSurfaces` + priority) | S | low (verify drawer ordering) |
| 3 — portal overview | XS | low (one delete/repoint) |
| 4 — self-nav consolidation | M | low (refactor, no URL change) |
| 5 — deep audit | M (sampled) | none |
| 6 — ratchet + docs | S | none |

Phases 1–3 + 0 + 6 are a single focused PR that takes the rail shells to a guarded zero. Phase 4 is a clean follow-up.
