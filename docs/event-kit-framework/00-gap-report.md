# XPMS Event Kit Framework — Pass A Gap Report

**Status:** Pass A (gap analysis) — **APPROVED 2026-06-05; Pass B built & verified.** See [README.md](README.md) for the delivered framework. Approved decisions: `scope` on new + shared tables · S/M/L/XL kit-scale with XPMS Tier 01–06 per line · ROS driven by `org_roles` JDs bound onto `cues`.
**Author:** Claude Code · 2026-06-05
**Mission:** A reusable, brand-agnostic, XPMS-compliant **Event Kit Framework** — parameterized template + catalog + generator that turns `{org, event, artist, mood_board, tier, venue, budget_band}` into a **zero-context-executable** venue kit. Casa Spotify Miami is validation data only, tagged `external_example`.

> **Headline finding:** far more XPMS canon is already implemented than the prompt assumes. The budget axes the framework must conform to are **already a live migration (`0070`)**, the classification backbone and atom-ID schema are **already in code**, the role/RDSP spine and the zero-context guide system **already exist**, and a **`cues` Run-of-Show table is already in schema**. The framework is therefore mostly an **aggregation + configurator + generator layer** over existing primitives — not a from-scratch build. This sharply reduces new schema and eliminates any risk of a parallel budget vocabulary.

---

## 1 · What already exists and is reusable (bind, do not reinvent)

| #   | Capability                                                                     | Where it lives                                                                                                                                                                                                                                  | What it gives the framework                                                                                                                                                                                                                                                                          | Action                                                                                      |
| --- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| R1  | **10-class Department backbone** (0000–9000)                                   | `src/lib/ghxstship/classes.ts:8-94` (+ `src/lib/xpms/index.ts` `XPMS_CLASSES`)                                                                                                                                                                  | Canonical Department axis w/ definitions + accents                                                                                                                                                                                                                                                   | **Bind**                                                                                    |
| R2  | **6 Tiers of Experience** (01–06)                                              | `src/lib/ghxstship/tiers.ts:8-58` (+ `XPMS_TIERS`)                                                                                                                                                                                              | Canonical Tier-of-Experience axis                                                                                                                                                                                                                                                                    | **Bind**                                                                                    |
| R3  | **Atom ID schema** `{ORG}-{EVT}{YY}{VEN}-{CLASS}.{DIV}.{SEC}-{ZON}-{SEQ}{REV}` | `src/lib/siteplan/atom-id.ts:1-192` (`buildAtomId`) + `src/lib/xpms/index.ts` (`buildAtomIdentifier`)                                                                                                                                           | Stable, append-only kit/line/zone IDs                                                                                                                                                                                                                                                                | **Bind**                                                                                    |
| R4  | **XPMS Universal Budget Template axes — IN SCHEMA**                            | `supabase/migrations/0070_xpms_universal_budget_template.sql`                                                                                                                                                                                   | `budgets` already carries `department, team, class, item, event, location, activation, discipline (budget_discipline), xpms_phase (8-gate CHECK), tier (budget_tier), xyz (budget_xyz), line_type (budget_line_type)`, qty/rate/estimate/actual; **+ `project_billing_draws`** for the draw schedule | **Bind — this is the budget SSOT.** My `budget_model.py` axes already match these enums 1:1 |
| R5  | **Catalog (item layer)**                                                       | `master_catalog_items` (`0051`) + `catalog_kind` enum (credential/catering/radio/tool/equipment/uniform/travel/lodging/vehicle) + `deliverables.catalog_item_id` FK                                                                             | Reusable SKU catalog the configurator draws from                                                                                                                                                                                                                                                     | **Bind + extend**                                                                           |
| R6  | **Per-individual Advance BOM**                                                 | `deliverables` (`0049`) — `deliverable_type` (25 incl. 9 `*_assignment` kinds), `deliverable_state`                                                                                                                                             | Advancing/fulfillment lifecycle per assignee                                                                                                                                                                                                                                                         | **Bind**                                                                                    |
| R7  | **Role catalog + RDSP onboarding spine**                                       | `org_roles` (`0007`, rich JDs: qualifications, decision rights, success/failure, day-one brief), `uis_roles`+`uis_role_class` (22) + `uis_lifecycle_state` (9) (`0019`), `memberships.persona`, `crew_members.roles[]`                          | Drives **role-based ROS** + RDSP (JD→Offer→KBYG→Guide)                                                                                                                                                                                                                                               | **Bind**                                                                                    |
| R8  | **Zero-context pre-arrival guide**                                             | `event_guides` + `GuideConfig`/`GuideSection` (16 types incl. `evacuation, fire_safety, radio, sops, ppe, contacts, credentials`) + `GuideView` + `guide_access_codes`                                                                          | The per-persona, zero-context briefing surface (already covers emergency/comms spine)                                                                                                                                                                                                                | **Bind + extend**                                                                           |
| R9  | **Run of Show engine — IN SCHEMA**                                             | `cues` (`0001`): `lane` ∈ {show,lights,audio,video,talent,safety,transport}, `status` ∈ {pending,standby,live,done,skipped}, `owner_id`, `scheduled_at`, `duration_seconds`, `event_id`                                                         | Role/lane-addressable cue timeline                                                                                                                                                                                                                                                                   | **Bind + extend** (lane→role coverage; `status`→`cue_state` naming fix)                     |
| R10 | **Generator precedent**                                                        | `src/lib/proposals/seed.ts` (`seedFromBlocks`, idempotent upsert→deliverables+catalog+budgets), `src/lib/templates/types.ts` (`TemplateBlueprint`), `LineItem` shape, `equipment_manifest` block, `proposal_templates_canon` (`20260603100001`) | Proven configure→materialize→seed path to reuse                                                                                                                                                                                                                                                      | **Bind + extend**                                                                           |
| R11 | **Domain-lib pattern**                                                         | `src/lib/marketplace.ts`, `src/lib/workforce.ts` (enum tuples `as const` + derived types + helpers)                                                                                                                                            | Precedent shape for a new `src/lib/eventkit/`                                                                                                                                                                                                                                                        | **Follow**                                                                                  |
| R12 | **Atom storage**                                                               | `xpms_atoms` + `xpms_atom_tiers` (`0001`); `budgets.xpms_atom_id`, `crew_members.xpms_atom_id`                                                                                                                                                  | Where issued atom IDs persist                                                                                                                                                                                                                                                                        | **Bind**                                                                                    |
| R13 | **Validated Casa six-axis model**                                              | `docs/proposals/casa-miami/budget_model.py` + 10 docs                                                                                                                                                                                           | Working, reconciled 4-tier validation set + line tuple shape                                                                                                                                                                                                                                         | **Reuse as the seed source for the 4 demo kits**                                            |

**Implication:** The framework's **Layer A** is mostly _additive aggregation tables_ (a kit container + the few axes that have no home yet) plus _one registry table_. It must **not** introduce any new budget/department/tier/phase/discipline/line-type vocabulary — those are locked in `0070` + `ghxstship/*`.

---

## 2 · Gaps — what's missing to make kits _zero-context executable_

| #   | Gap                                                       | Why it's required (zero-context / prompt §)                                                                                             | Proposed artifact                                                                                   |
| --- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| G1  | **No Kit container/aggregate**                            | §5 — a kit must be one self-contained, versioned object binding params→zones→senses→BOM→ROS→gates→rider                                 | `event_kits` + `event_kit_lines` (Layer A)                                                          |
| G2  | **No URID Registry table**                                | §4 — "Map every kit line to a URID"; today `department/team/class` are free-text on `budgets`                                           | `xpms_registry` (DEPT.TEAM.SECTION), seeded from the v08 template **Registry** sheet (140 rows)     |
| G3  | **No configure-to-order layer**                           | §6 — base→options→substitutions→upgrades→add-ons w/ cost delta, lead time, phase, discipline, dependencies, zone/senses                 | `kit_packages` (base per tier) + `kit_options` (modifiers) over `master_catalog_items`              |
| G4  | **No 5-Senses touchpoint matrix**                         | §5.3 — the experiential spine linking design→BOM, per zone                                                                              | `kit_touchpoints` (zone × sense × intent × delivering element)                                      |
| G5  | **No addressable venue zone / XYZ spatial table**         | §5.2 — every room/zone keyed w/ zone code, dims, capacity, power/AV/load-in                                                             | `kit_zones` (zone code + spatial metadata; demo-seed The Sanctuary)                                 |
| G6  | **No 8-gate phase plan w/ exit-checklists**               | §5.4 — objective + exit-gate checklist + owner + done-when, per kit                                                                     | `kit_phase_gates` (one row per kit×phase)                                                           |
| G7  | **Role-based ROS not generated/bound to kit**             | §5.5 — timeline for _every_ UIS role w/ call times, cues, dependencies, hand-offs, done-when; must reconcile to phases + BOM            | Extend `cues` (role/persona axis) + generator that emits cues from kit                              |
| G8  | **No consolidated tech/requirements rider by zone×phase** | §5.8 — power/structural/electrical/AV/acoustic/rigging/network flagged by zone+phase                                                    | `kit_rider_items` (or derive from `kit_lines` flags)                                                |
| G9  | **No `external_example` isolation**                       | §1 — third-party (Casa/Spotify) brand content must never enter the canonical own-brand catalog/registry. **No such field exists today** | Add `scope` enum (`canonical`/`external_example`) to kit + new catalog tables (**OPEN Q — see §5**) |
| G10 | **No kit generator**                                      | §6, §9.3 — one command/flow assembles a kit from params                                                                                 | `src/lib/eventkit/` lib + `scripts/generate-kit.ts` (reuse `seedFromBlocks` path)                   |
| G11 | **BOM lines lack zone + 5-senses linkage**                | §5.6 — every BOM line ties to a touchpoint + zone                                                                                       | `kit_lines` carries `zone_id` + `touchpoint_id` (kit layer, not `budgets`)                          |

---

## 3 · Proposed new artifacts (for approval — NOT yet applied)

### Layer A — Data model (append-only migrations, timestamp-numbered after `20260603100001`)

Proposed migration `20260605HHMMSS_event_kit_framework.sql` (single append-only migration, or split 2–3):

- **`xpms_registry`** — `(id uuid, urid text UNIQUE [DEPT.TEAM.SECTION], department text, team text, section text, default_discipline text, level text, notes text)`. Seeded from the v08 Registry sheet. Lets every kit line FK-map to a URID instead of free-text.
- **`event_kits`** — the aggregate: `(id, org_id, scope, project_id?, name, kit_scale [S/M/L/XL], xpms_tier_default, venue_id?, budget_band_low/high_cents, atom_namespace, version, params jsonb [artist, mood_board, …], generated_at, …)`.
- **`kit_zones`** — `(id, kit_id, zone_code, name, dimensions, capacity, power_notes, av_notes, loadin_notes, xyz_default)`.
- **`kit_touchpoints`** — `(id, kit_id, zone_id, sense [sight|sound|scent|taste|touch], design_intent, delivering_element, line_ref?)`.
- **`kit_lines`** — the configured Advance BOM. Each line carries the full six axes by FK/enum: `department, team, class, urid → xpms_registry, discipline (budget_discipline), xpms_phase, tier (budget_tier), xyz (budget_xyz), line_type (budget_line_type)`, `zone_id`, `touchpoint_id`, `catalog_item_id?`, qty/rate/estimate_cents, `atom_id`. Rolls up to / mirrors `budgets`.
- **`kit_phase_gates`** — `(id, kit_id, xpms_phase, objective, exit_checklist jsonb, owner_role, key_deliverables jsonb)`.
- **`kit_packages`** + **`kit_options`** — configure-to-order: base package per `kit_scale`, and options w/ `option_type [option|substitution|upgrade|addon]`, `cost_delta_cents`, `lead_time_days`, `xpms_phase`, `discipline`, `depends_on`, `zone_ref`, `sense_ref`.
- **ROS:** extend `cues` with a `role` / `owner_role` column (persona/role axis) + add `cue_state` aligned enum (keep legacy `status` until migrated); plus a `kit_id` link. No new ROS table if `cues` suffices.
- **Isolation:** `scope` column (`canonical` default) on `event_kits`, `kit_packages`, `kit_options`, `xpms_registry` rows that are demo-only. (Shared tables `budgets`/`deliverables` get `external_example` only via the owning kit's scope, not a column, unless you prefer otherwise — **OPEN Q**.)

All conform to: 3NF/SSOT, append-only, immutable-UUID-surrogate + human-readable-descriptor split, `*_phase`/`*_state` naming (no new `status`), atom-ID schema.

### Layer B — Kit Template (`src/lib/eventkit/`)

- `src/lib/eventkit/index.ts` — enum tuples (`KIT_SCALES = ['S','M','L','XL']`, sense list, option types) + types derived `as const`, mirroring `marketplace.ts`/`workforce.ts`.
- `src/lib/eventkit/template.ts` — the canonical parameterized "house frame": the nine §5 sections as a typed `KitBlueprint` with explicit `{org,event,artist,mood_board,tier,venue,budget_band}` slots, extending `TemplateBlueprint`.
- Re-exports the canonical axes from `ghxstship/*` + `xpms/*` (no redefinition).

### Layer C — Generator + Seed

- `src/lib/eventkit/generate.ts` — configure-to-order engine: base package + selected options → assembles zones, touchpoints, BOM lines (6-axis tagged), phase gates, ROS cues, rider; validates against tier budget band + zone constraints; **surfaces conflicts** rather than silently resolving. Reuses the `seedFromBlocks` idempotent-upsert pattern.
- `scripts/generate-kit.ts` — single-command entry: `generate-kit --tier S --artist "…" --venue sanctuary --budget-band "<50k" --mood-board …`.
- **Seed:** materializes the **four Casa tiers** (S Silvana / M Rawayana / L Under Argentino / XL Calle Casa) from `budget_model.py`'s validated data, all tagged `scope = external_example`. Optional XLSX export to Budget/Expenses/Summary sheets for parity (**OPEN Q**).
- `docs/event-kit-framework/README.md` — how to generate a kit from params + how each layer maps to XPMS canon.

---

## 4 · Conformance commitments (acceptance criteria mapping)

- **Atom ID** issued via existing `buildAtomId`/`buildAtomIdentifier`; codes never change (append-only). ✔ §4
- **Budget axes** = the `0070` enums verbatim; **no parallel vocabulary**. ✔ §4
- **Fee & Contingency are LINE TYPES, never phases**; phase curve = `Scope` only (already how `budget_model.py` + `0070` work). ✔ §4, §9.6
- **Naming discipline:** new columns are `*_phase`/`*_state`; no new `status`; eight lifecycles stay separate. ✔ §4
- **URID** mapped per line via `xpms_registry`. ✔ §4, §9.5
- **Zero-context:** every kit emits all nine §5 sections; ROS covers all roles and reconciles to phases + BOM. ✔ §9.4/§9.7
- **External isolation:** all Casa records `scope = external_example`. ✔ §9.8
- **Append-only migrations**, timestamp-numbered. ✔ §8

---

## 5 · Open questions (must resolve to finalize the build plan)

1. **`external_example` isolation mechanism.** No `scope`/`is_example` field exists today (the two `scope` columns found are domain-specific: `notifications.scope='all'`, `proposal_templates.scope='general'`). **Proposed:** add `scope text NOT NULL DEFAULT 'canonical' CHECK (scope IN ('canonical','external_example'))` to the new kit + catalog-config tables only. Confirm field name/approach and whether shared tables (`budgets`,`deliverables`,`master_catalog_items`) also need it.
2. **"Four tiers" meaning.** Prompt's own table is **S/M/L/XL event-scale** (assumed). **Proposed:** `kit_scale ∈ {S,M,L,XL}` is the kit selector; **XPMS Tier 01–06 stays a per-line attribute** (`budget_tier`). Confirm (vs. mapping each kit to a single XPMS Tier).
3. **ROS role source.** Three role systems exist. **Proposed:** ROS personas/lanes driven by `org_roles` (operational JDs) bound onto `cues` lanes/owner; `uis_role_class` for engagement. Confirm the canonical role list to drive ROS.
4. **XLSX export parity.** Should a generated kit also export to the v08 **Budget/Expenses/Summary** sheets (round-trip to `XPMS_Universal_Budget_Template.xlsx`)? **Proposed:** yes, but as a Phase-2 add-on, not blocking the first generate.
5. **Registry seed source.** OK to seed `xpms_registry` from the **Registry** sheet of `~/Downloads/XPMS_Universal_Budget_Template.xlsx` (140 rows)? (It's the only authoritative URID source found; no DB registry exists.)
6. **Kit persistence shape.** Materialize kits as **DB rows** (`event_kits` + lines, like proposals) **and** a rendered doc/preview — confirm both, or DB-only.

---

## 6 · Recommended build sequence (Pass B, on approval)

1. `xpms_registry` migration + seed from Registry sheet.
2. `event_kit_framework` migration (kit aggregate + zones + touchpoints + lines + phase_gates + packages + options + `cues` role column) — append-only, `scope` isolation.
3. `src/lib/eventkit/` (Layer B template + enums) binding existing canon.
4. `src/lib/eventkit/generate.ts` + `scripts/generate-kit.ts` (Layer C).
5. Seed + generate the four Casa kits (`external_example`); verify zero-context completeness + 6-axis reconciliation (reuse `budget_model.py` assertions).
6. README + XPMS mapping doc. (XLSX export if approved.)

---

## 7 · Decision gate

**No schema will be mutated until this report is approved.** Please confirm the plan and answer the §5 open questions (the next message will ask the four that change the schema shape). On approval I proceed to Pass B in the sequence above.
