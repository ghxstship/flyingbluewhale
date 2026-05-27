# Construction-PM Parity — 08 — Shipped Round 74 (Final)

**Date:** 2026-05-27
**Companion to:** [00 master roadmap](00-master-roadmap.md) · [06 — rounds 67–72](06-shipped-rounds-67-72.md) · [07 — acceptance criteria](07-acceptance-criteria.md)

Round 74 closes the **last open gap** in the construction-PM parity audit — G-030 / F44 multi-entity + multi-currency consolidation. With this round, every gap in [`03-gap-inventory.md`](03-gap-inventory.md) is at C/S; nothing remains except commercial-distribution plays (G-031 GraphQL, G-032 marketplace UI, G-033 native wrappers) and the Wave 5 differentiator program.

---

## What shipped

### Schema (`20260527100000_multi_entity_currency.sql`)

| Table / view                                   | Purpose                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public.org_entities`                          | Sister-org legal-entity hierarchy: `parent_entity_id`, `legal_name`, `short_code`, `base_currency`, `jurisdiction`, `tax_id`, `consolidation_method` (full / equity / proportional / none), `ownership_pct`, `consolidation_state` (active / pending / dormant / divested), `effective_from`/`_to`. RLS: select for org members, insert/update gated to owner+admin. |
| `public.exchange_rates`                        | Adapts the pre-existing scaffold (was unused) into the daily FX rate store. Public-readable + service-role-writeable. Helper fn `public.fx_rate_on(p_from, p_to, p_date)` returns the latest snapshot on/before the date, short-circuiting to `1.0` when from = to.                                                                                                  |
| `invoices`, `expenses`, `payment_applications` | Each gains `entity_id` FK + `fx_rate_to_base` + `base_currency` + `base_amount_cents`. BEFORE INSERT/UPDATE triggers (`fx_snapshot_for_invoices`, `fx_snapshot_for_expenses`) auto-fill the snapshot at write time using the entity's `base_currency` and the row date.                                                                                              |
| `public.v_consolidated_ar` view                | Joins `invoices` + `org_entities`; emits `consolidated_amount_cents` that applies `ownership_pct` for proportional consolidation, zeros entities flagged `consolidation_method='none'`, and passes through `base_amount_cents` for full/equity. Granted `select` to authenticated.                                                                                   |

### Runtime — `src/lib/finance/fx.ts`

- **Primary provider:** Frankfurter (api.frankfurter.dev) — ECB-backed, free, no API key. Default bases: USD/EUR/GBP/CAD/AUD/JPY/MXN. Default quotes include the 13 most common construction-PM currencies.
- **Fallback provider:** exchangerate.host — per-base, only when Frankfurter errors. Differs on response shape (`quotes` vs `rates`); the lib normalizes both.
- **`pullDailyRates(date, bases)`** walks the configured base list, prefers primary, falls back per-base, returns a flat `FxRow[]` ready for `exchange_rates` upsert.

### API

- **`POST /api/v1/integrations/fx/refresh`** — body `{ date?, bases? }`. Idempotent upsert keyed on the unique index `(from, to, effective_at, source)`. Org-scoped auth guard; service-role supabase client for the write.

### Console (ATLVS shell)

- **`/console/finance/entities`** — list of legal entities with state pill, base CCY, method, ownership %. Metric cards: total, active, currencies, subsidiaries.
- **`/console/finance/entities/new`** — full form (legal name, short code, base CCY, jurisdiction, tax ID, parent, ownership %, method, state, effective window) + zod-validated action.
- **`/console/finance/entities/[id]`** — entity detail with per-entity AR rollup pulled from `v_consolidated_ar` (base total / consolidated total / outstanding / paid).
- **`/console/finance/consolidation`** — group-rollup dashboard. One card per entity sorted by consolidated total; metric tiles for group consolidated / outstanding / paid in the org's default currency.
- **Finance hub** gains `Entities` + `Consolidation` tiles in the navigation grid.

---

## Final parity scorecard

| Phase                            | Pre-35 | Post-72 | Post-74                                           | Δ from start |
| -------------------------------- | ------ | ------- | ------------------------------------------------- | ------------ |
| A. Identity / Access             | 100%   | 100%    | 100%                                              | —            |
| B. Documents / Drawings          | 13%    | 100%    | 100%                                              | +87pp        |
| C. Communications / Workflow     | 67%    | 100%    | 100%                                              | +33pp        |
| D. Schedule / Budget / Contracts | 25%    | 100%    | 100%                                              | +75pp        |
| E. Field Execution               | 75%    | 100%    | 100%                                              | +25pp        |
| F. Financials                    | 20%    | 99%     | **100%** (F44 multi-entity / multi-currency live) | +80pp        |
| G. Closeout / Handover           | 25%    | 100%    | 100%                                              | +75pp        |
| H. Analytics / AI / Ecosystem    | 33%    | 100%    | 100%                                              | +67pp        |

**Aggregate: 42% → 100% C/S parity** across all 55 table-stakes features and all 38 inventory gaps.

---

## What now genuinely remains

**Nothing in the parity inventory.** The three "post-parity" items in [`03-gap-inventory.md`](03-gap-inventory.md) are explicitly commercial-distribution plays, not engineering parity items:

- **G-031** GraphQL API layer — the REST surface at `/api/v1/*` is complete and partner-integratable. GraphQL is a developer-experience nice-to-have, not a procurement criterion.
- **G-032** Integration marketplace UI + cert program — a commercial play (Procore Connect-style). Needs partner-program design before code.
- **G-033** Native iOS / Android wrappers — the PWA covers every field flow per the original ADR. Capacitor wrappers are a distribution decision, not an engineering deliverable.

The next motion is the **Wave 5 differentiator program** described in [`00-master-roadmap.md`](00-master-roadmap.md):

1. Unified events ⇄ construction lifecycle UX (Procore can't do festivals; we already do, but the cross-shell story is undersold).
2. Prequalified-sub marketplace wrapper around the existing RFQ flow (Migration 0002 spine + Round 43 ITB packages).
3. AI-first authoring — RAG corpus expansion + agentic drafting on RFIs / submittals / daily logs (extends Round 47 + 61 spine).

---

## Aggregate output across rounds 35–74 (40 rounds)

- **33 migrations** applied to the Supabase project (`xrovijzjbyssajhtwvas`).
- **~92 new tables**, **45+ enums**, **~205 RLS policies**, **~205 indexes**.
- **pgvector** + **multi-entity FX snapshot triggers** + **CPM PG fn** + **risk scoring PG fn** + **WIP snapshot PG fn** + **cosine search PG fn** + **FX rate lookup PG fn** + 3 auto-promote triggers + 2 FX snapshot triggers + the consolidation view.
- **24 console surfaces** added (entities + consolidation join the list).
- **10 runtime engines** (Round 74 adds the FX worker).
- **10+ webhook / API endpoints** (Round 74 adds `/api/v1/integrations/fx/refresh`).
- **5 PG functions** for batch computation: CPM, risk scoring, WIP snapshot, cosine search, FX rate lookup.

The construction-PM table-stakes parity program is **complete**.
