# ATLVS Event Kit Framework

A reusable, **brand-agnostic, XPMS-compliant** configure-to-order system that turns
`{org, event, artist, mood_board, tier, venue, budget_band}` into a
**zero-context-executable** venue kit — every persona, every phase, every line item —
from the Producer/GM perspective. Build-your-own-sushi-menu × building a house:
a fixed structural frame (the permanent build-out) plus base configs, options,
substitutions, upgrades, and add-ons.

> **The framework is the product** (own-brand XPMS/ATLVS IP). Casa Spotify Miami is
> **example/validation data only**, tagged `scope = external_example` so third-party
> brand content never enters the canonical own-brand catalog or registry.

See the Pass-A analysis in [00-gap-report.md](00-gap-report.md). This README documents
the delivered build (Pass B).

---

## Three layers

### Layer A — Data model (Supabase, append-only migrations)

| Migration                                                                                                    | Adds                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`20260605150000_xpms_registry.sql`](../../supabase/migrations/20260605150000_xpms_registry.sql)             | `xpms_registry` — canonical **URID** (DEPT.TEAM.SECTION) backbone, 137 nodes seeded from the v08 Universal Budget Template Registry sheet                                                                                                                                            |
| [`20260605150100_event_kit_framework.sql`](../../supabase/migrations/20260605150100_event_kit_framework.sql) | `event_kits`, `kit_zones`, `kit_touchpoints`, `kit_lines`, `kit_phase_gates`, `kit_packages`, `kit_options`; extends `cues` for role-based ROS; adds `scope` (canonical \| external_example) to the new tables **and** to shared `budgets` / `deliverables` / `master_catalog_items` |

Binds to existing canon — **introduces no new budget vocabulary**:

- Budget axes (`discipline`/`tier`/`xyz`/`line_type`) → migration `0070` enums, verbatim.
- 8-gate `xpms_phase` → same CHECK list as `budgets.xpms_phase`.
- Department / Tier → `src/lib/ghxstship/{classes,tiers}.ts` (0000–9000, 01–06).
- URID → `public.xpms_registry`. Atom IDs → `src/lib/siteplan/atom-id.ts`.

Naming discipline: lifecycle columns are `*_state` (`kit_state`, `gate_state`) — never `status` in new schema. RLS: org read via `private.is_org_member`, manager+ write via `private.has_org_role`.

### Layer B — Kit Template (the parameterized "house frame")

- [`src/lib/eventkit/index.ts`](../../src/lib/eventkit/index.ts) — canonical axis vocabularies (`KIT_SCALES`, `KIT_PHASES`, `KIT_DISCIPLINES`, `KIT_TIERS`, `KIT_XYZ`, `KIT_LINE_TYPES`, `SENSES`, `OPTION_TYPES`), budget-band↔scale mapping, and the rollup/reconcile/validate helpers (mirrors `marketplace.ts`/`workforce.ts`).
- [`src/lib/eventkit/template.ts`](../../src/lib/eventkit/template.ts) — `KitBlueprint` (the nine §5 sections), the canonical `ROS_ROLES` catalog, and `emptyKitFrame(params)` which pre-seeds the 8 gated phases.

### Layer C — Generator + Seed (the "sushi menu" engine)

- [`src/lib/eventkit/generate.ts`](../../src/lib/eventkit/generate.ts) — pure `assembleKit()` + `kitToRows()` + conflict validation (typechecked engine for app use).
- [`scripts/generate-kit.mjs`](../../scripts/generate-kit.mjs) — runnable CLI/seeder (RLS path, signs in as the demo admin).
- [`scripts/data/sanctuary-frame.json`](../../scripts/data/sanctuary-frame.json) — the shared venue + process frame (8 zones, 40-cell 5-senses matrix, 8 gates, role-based ROS, tech rider).
- [`docs/proposals/casa-miami/budget_model.py`](../../docs/proposals/casa-miami/budget_model.py) `--kits` — emits `_fragments/casa_kits.json` (the reconciled demo BOM, SSOT for the four Casa tiers).

---

## Generate a kit

```bash
# 0. (once) refresh the Casa demo data from the reconciled budget model
python3 docs/proposals/casa-miami/budget_model.py --kits

# 1. seed the canonical configure-to-order catalog (base packages + options)
node scripts/generate-kit.mjs --catalog

# 2a. generate a single kit from params (canonical) — proves param → kit
node scripts/generate-kit.mjs --tier M --artist "Artist Name" \
     --event MYEVT --venue "The Sanctuary" --budget-band "$50K-150K"

# 2b. generate the four Casa validation kits (tagged external_example)
node scripts/generate-kit.mjs --demo casa
```

Each run assembles the venue frame (zones → 5-senses touchpoints → 8 phase gates →
role-based ROS → tech rider), maps every BOM line across all six XPMS axes, issues an
atom namespace, and persists. Re-running is idempotent (prior kit with the same
`atom_namespace` + `scope` is replaced).

Swapping `{artist}` / `{mood_board}` re-themes a kit **without structural change** — the
frame, gates, zones, senses, and ROS are constant; only `params`, BOM content, and
reserves vary.

---

## How the nine zero-context sections (§5) map to schema

| §   | Section                            | Where                                                                                           |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| 5.1 | Cover / meta block                 | `event_kits` (scale, venue, atom_namespace, kit_version, `params`)                              |
| 5.2 | Venue map + XYZ spatial addressing | `kit_zones` (zone_code, dims, capacity, power/AV/load-in)                                       |
| 5.3 | 5-Senses touchpoint matrix         | `kit_touchpoints` (zone × sense × intent × delivering element) — 8×5 per kit                    |
| 5.4 | 8 gated phase plan                 | `kit_phase_gates` (objective, exit_checklist, owner_role, key_deliverables, gate_state)         |
| 5.5 | Role-based Run of Show             | `cues` (lane, owner_role, xpms_phase, done_when, scheduled_at, depends_on_cue_id)               |
| 5.6 | Configure-to-order Advance BOM     | `kit_lines` (six axes + URID + zone + touchpoint + catalog_item)                                |
| 5.7 | Budget rollup                      | `kit_lines` Line Types — Scope phase-curve; Fee/Contingency/Allowance/Markup roll up separately |
| 5.8 | Tech / requirements rider          | `sanctuary-frame.json` `rider[]` (zone × phase × category)                                      |
| 5.9 | Plug-and-play slots                | `event_kits.params` (`artist`, `mood_board`, …) + `kit_options` (configurator)                  |

---

## Configure-to-order model (§6)

`kit_packages` (base per scale) → `kit_options` (`option` \| `substitution` \| `upgrade` \| `addon`).
Each option records `cost_delta_cents`, `lead_time_days`, `xpms_phase`, `discipline`,
`urid`, `sense`, `zone_ref`, and `depends_on`. `validateConfiguration()` (in
`index.ts`) checks the configured total against the tier budget band, verifies option
dependencies, and confirms target zones exist — **surfacing conflicts, never silently
resolving them**.

---

## Acceptance criteria — verified

| #   | Criterion                                                                                 | Status                                                                         |
| --- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 9.1 | Gap report before schema change                                                           | ✅ [00-gap-report.md](00-gap-report.md), approved                              |
| 9.2 | Schema conforms to budget axes + URID registry; append-only                               | ✅ binds `0070` enums; 2 timestamp migrations                                  |
| 9.3 | One command generates a kit from params                                                   | ✅ `generate-kit.mjs --tier … --artist …`                                      |
| 9.4 | Every kit has all nine §5 sections, zero-context                                          | ✅ 8 zones / 40 touchpoints / 8 gates / 15 ROS cues / full BOM + rider per kit |
| 9.5 | Every BOM line carries Class·Tier·Discipline·Phase·XYZ·URID·Line Type + touchpoint + zone | ✅ 0 scope lines missing URID / zone / touchpoint                              |
| 9.6 | Fee & Contingency only as line types, never phases; phase curve = Scope only              | ✅ reserve lines have `xpms_phase = NULL`                                      |
| 9.7 | Role-based ROS covers roles, reconciles to phases + BOM                                   | ✅ 12 distinct ROS roles, every cue has owner_role + lane + phase              |
| 9.8 | All four Casa tiers generate cleanly, tagged `external_example`                           | ✅ S/M/L/XL; grand totals $47.5K/$128K/$228K/$385K                             |
| 9.9 | Swapping artist/mood board re-themes without structural break                             | ✅ params-driven; constant frame                                               |

In-DB reconciliation (all four kits): every Scope rollup cut (Department / Discipline /
Phase / Tier / XYZ) equals the Scope subtotal; `Scope + Fee + Contingency + Allowance +
Markup` equals the grand total. Canonical `budgets` / `master_catalog_items` carry **zero**
`external_example` rows — Casa data is fully isolated.

---

## Extending the framework

- **New venue:** author a frame JSON like `sanctuary-frame.json` (zones + 5-senses
  matrix + gates + ROS + rider) and pass it to `assembleKit()`.
- **New configurator options:** add rows to `kit_options` (or extend the `--catalog`
  block); set `cost_delta_cents`, `xpms_phase`, `discipline`, `urid`, `sense`, `zone_ref`,
  `depends_on`.
- **Wire to the console:** `assembleKit` + `kitToRows` are pure and importable by a
  server action under `/console/...` to generate kits in-app (the `.mjs` is the headless
  demonstrator).
- **XLSX parity (Phase 2, optional):** export a kit's `kit_lines` to the v08
  Budget/Expenses/Summary sheets for round-trip with `XPMS_Universal_Budget_Template.xlsx`.
