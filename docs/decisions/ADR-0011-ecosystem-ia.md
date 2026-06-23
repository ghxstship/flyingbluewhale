# ADR-0011 — Ecosystem IA: organizing principle + addressing model

**Status:** Proposed
**Date:** 2026-06-23
**Owner:** Platform engineering
**Extends:** ADR-0006 (domain-noun console nav) · ADR-0001 (three-shell topology)
**Source:** ATLVS Ecosystem design kit (v7.2 "Monument") — `IMPLEMENTATION.md`, `ia/ia-model.json`, `ATLVS IA Review & Recommendation`

## Context

ADR-0006 ratified a domain-noun console sidebar; the IA churn since then (Workforce vs People, Sales vs Commerce, Operations junk-drawer, ~22 duplicate-home leaves) shows the grouping was directionally right but never finished, and that **the lack of a written organizing principle is what lets the churn recur**. Separately, the ecosystem has grown to four products (ATLVS · COMPVSS · GVTEWAY · LEG3ND) whose public addressing has drifted — LEG3ND lives inside the console (`/console/legend/*`) though it is conceptually a peer shell, and the subdomain spellings mix brand wordmarks with infrastructure.

This ADR locks two decisions **once**, so the re-grouping stops being re-litigated:

1. the permanent organizing principle for module navigation, and
2. the addressing model that separates infrastructure (subdomains) from brand expression (wordmarks).

It does **not** change design-system tokens, and every change it authorizes is additive or a 301 redirect — 100% of current URLs stay reachable.

## Decision

### 1 · Organizing principle (permanent)

**Module navigation is domain-noun, ordered by the production lifecycle: Sell → Plan → Source → Build → Staff → Operate → Settle.** The lifecycle is an *ordering*, not a set of labels — the sidebar shows domain nouns (Commerce · Projects · Procurement · Production · People · Operations · Finance), and the lifecycle lives **on the project record as phase tabs**, never as the sidebar. This is the rule ADR-0006 implied; this ADR writes it down.

Consequences, finalized in the nav SSOT (`src/lib/nav.ts#platformNav`):

- **Workforce → People** (directory, engagement, development, time & recognition).
- **Sales + Marketplace + Hospitality → Commerce**, with a **Sales** section inside it.
- The **Operations** junk-drawer splits into Coordination · Logistics · Safety · Messages.
- **One home per concept.** The ~22 duplicate-home leaves resolve to a single owner (Accreditation → People; Master Catalog → Procurement; Courses → People as a LEG3ND deep-link; one Incidents CRUD home). Everything else cross-links.
- **No echo items** — an item whose label equals its group is dropped; the group header is the hub link.
- **XPMS taxonomy is admin config, not daily nav** — Atoms/Classes/Codebook/Tiers/Provenance/Variance move to **Settings → Taxonomy** (`/studio/settings/taxonomy`).
- **The coordinate lens (class × phase) is an analytical lens, never a top-level nav group.** `CoordinateMatrix` surfaces it on the project overview; the sidebar stays domain-noun.

### 2 · Addressing model

**The subdomain is the canonical public boundary; `/studio` `/p` `/m` `/legend` are internal route-group names** the host-rewrite middleware (`src/proxy.ts`) maps onto (and the path-prefix fallback for preview deploys). Production URLs **never double the prefix** (`legend.atlvs.pro/courses`, not `legend.atlvs.pro/legend/courses`).

- **Subdomains use real-word spellings** — `app` · `compass` · `gateway` · `legend` — because domains are infrastructure, not brand expression.
- **The stylized wordmarks — COMPVSS · GVTEWAY · LEG3ND — stay in the UI and marketing only.**
- **Brand + descriptor** pairing is required on external/first-contact surfaces (e.g. "GVTEWAY — public marketplace").
- `urlFor()` (`src/lib/urls.ts`) is the single switch between subdomain mode and the path-prefix fallback; nothing hardcodes a host.

### 3 · Route-group renames authorized by this ADR

| Today | Becomes | Public subdomain | Migration |
|---|---|---|---|
| `(platform)/console/**` | `(platform)/studio/**` | `app.atlvs.pro` | 301 `/console/:path*` → `/studio/:path*` in `next.config.ts`, kept ≥1 release |
| `(platform)/console/legend/**` | `(legend)/legend/**` (own shell) | `legend.atlvs.pro` | move subtree; proxy host-rewrite + Vercel domain (applied by the operator) |

COMPVSS (`/m`, `compass`/`compvss`) and GVTEWAY (`/p`, `gateway`/`gvteway`) route groups are unchanged by this ADR.

## Migration rules (no regression)

1. **Every existing URL stays reachable** — re-grouping + 301 redirects, never a silent route deletion.
2. **`platformNav` is finalized in one PR** — sidebar is a layout concern with no data dependencies; dual-rendering would create twin nav graphs and audit drift.
3. **Group landing pages are orchestration hubs**, not redirects.
4. **The IA model is generated, not hand-authored** — `npm run gen:ia-map` emits `public/ia/ia-model.json` from `nav.ts` + the route tree; `gen:ia-map:check` is a pre-push drift gate (mirrors `gen:sitemap:check`).

## Acceptance checks

- [ ] Every URL in today's `platformNav` resolves 200 after the rename (no orphans) — `nav-routes.test.ts`.
- [ ] `/console/:path*` 301s to `/studio/:path*`; old links never 404.
- [ ] `legend.atlvs.pro/<path>` resolves the `(legend)` shell with no doubled prefix — `url-canon.test.ts`.
- [ ] `public/ia/ia-model.json` is in sync — `gen:ia-map:check` green.
- [ ] Sidebar shows the finalized domain-noun groups; XPMS taxonomy is under Settings.
- [ ] `npm test` + `npm run gen:sitemap:check` green; `next build` green.

## Out of scope

- **Design-system tokens** — unchanged (v7.0 Monument 2.0 stands).
- **Vercel domain config + DNS** — authored as code/notes here; applied by the operator (not by this change).
- **The new product surfaces** (GVTEWAY consumer, Events/Revenue, LEG3ND learning spine) — separate work items that ride on top of this addressing model.

## Decision needed

Approve (a) the Sell→Plan→Source→Build→Staff→Operate→Settle ordering with domain-noun labels and one-home-per-concept, and (b) the real-word subdomain addressing model with internal `/studio /p /m /legend` prefixes. On approval, the nav finalize + `/console→/studio` rename (Phase 4) and the LEG3ND shell promotion (Phase 5) execute against this contract.
