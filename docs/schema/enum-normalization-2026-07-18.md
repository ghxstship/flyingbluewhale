# Enum Normalization / Canonicalization / Enrichment Pass — 2026-07-18

Read-only discovery + **staged** (unapplied) remediation for the `flyingbluewhale`
Postgres schema (`xrovijzjbyssajhtwvas`). Nothing in this pass has been applied to the
live database. All migrations live in `supabase/migrations/_staged_enum_normalization/`
(outside the numbered migration set, so no runner auto-applies them).

Companion artifacts:

- Variant → canonical mapping: [`enum-normalization-2026-07-18.variant-map.csv`](./enum-normalization-2026-07-18.variant-map.csv)
- Staged migrations + run order: [`_staged_enum_normalization/README.md`](../../supabase/migrations/_staged_enum_normalization/README.md)

---

## 1. Headline finding

The schema is already **heavily normalized**: ~210 native `enum` types, and the vast
majority of categorical text columns already carry `CHECK (... = ANY (ARRAY[...]))`
constraints. The prior LDP Phase-6 pass (`docs/LDP_STATUS_RENAME_MAP.md`) renamed 66
bare `status` columns to `*_state`. So the residual normalization surface is **small and
targeted**, not a green field. Doing a blind "add a CHECK to every text column" sweep
would be noise and would risk breaking inserts the app relies on.

What actually remains falls into four buckets:

| Bucket | Count | Representation decision | Applied? |
| --- | --- | --- | --- |
| Dirty values (casing/synonym) | 2 rows | Canonicalize in place (backfill) | **Staged** (M1) |
| Repeated-label free-text `category` columns (no constraint) | 5 cols | Lookup table + FK (append-only) | **Staged** (M2, M3 destructive) |
| LDP naming residue (`*_status` text columns) | 6 cols | Rename to `*_state` | **Staged** (M4, app cutover) |
| Structural / ambiguous | 4 classes | **Flag only** — owner decision | Not migrated |

---

## 2. Dirty values detected (the "canonicalize" step)

Only two genuine dirty values exist in live data (the seed is otherwise clean):

- **`budgets.category`** — `production` (1 row) is a casing duplicate of `Production`
  (3 rows). Canonical → `Production`. Affected id `4f3fa44f-b088-4a55-9cd7-d1c3b444bab2`.
- **`vendors.category`** — `scenic` (1 row) is lowercase against Title-Case peers.
  Canonical → `Scenic`. Affected id `969f0db3-d61e-4c9b-be93-56684bb4db2d`.

Both are handled by **M1** (`01_data_canonicalize.sql`) as id-scoped, exactly-reversible
`UPDATE`s. See the variant map for the full crosswalk.

> **Ambiguous, not collapsed:** `vendors.category` also has `Staging` **and**
> `Staging & rigging`. These may be the same concept or two — I did **not** collapse
> them (per "never collapse two genuinely distinct concepts"). Flagged for review.

---

## 3. Representation decisions

Per the stated default (evolving vocabularies → **lookup table + FK**, not native enum),
the 5 unconstrained free-text `category` columns become lookup tables:

| Column | Rows w/ value | Target lookup table | Seeded from |
| --- | --- | --- | --- |
| `certifications.category` | 9 | `ref_certification_category` | existing 5 clean values |
| `onboarding_steps.category` | 110 | `ref_onboarding_step_category` | existing 5 clean values |
| `expenses.category` | 10 | `ref_expense_category` | existing 3 values (Title-cased) |
| `budgets.category` | 9 | `ref_budget_category` | existing 6 (after casing fix) |
| `vendors.category` | 4 | `ref_vendor_category` | existing 4 (1 flagged) |

Each lookup table gets the canonical shape: `code text PRIMARY KEY` (immutable,
append-only), `display_label`, `description`, `sort_order`, `is_active`,
`created_at`/`updated_at`, RLS (read to `authenticated`, writes service-role only).

**Reserved as CHECK/native-enum (already done, left alone):** stable code-level sets that
already carry a CHECK — `chart_of_accounts.account_type`, `files.virus_scan_status`,
`po_invoice_matches.match_status`, `integrations.category`, `automations.trigger_kind`,
`document_state_transitions.document_kind`, etc. No new constraint needed.

**Why not native enum for the categories:** vendor/expense/budget categories are
business vocabularies that will grow; a lookup table avoids `ALTER TYPE ... ADD VALUE`
churn and lets non-engineers extend them with a row.

---

## 4. Enrich + wire-up (reversible, non-destructive)

**M2** (`02_reference_tables_and_fk.sql`) is the safe, additive half of the cutover:

1. create the 5 lookup tables + seed canonical rows,
2. add a nullable `<column>_code` FK column next to each legacy text column,
3. backfill `<column>_code` via the explicit crosswalk in the variant map,
4. add the FK constraint (`NOT VALID` → `VALIDATE`) and index every FK column.

The **legacy text column is retained** through M2 — the app keeps working unchanged.

**M3** (`03_DESTRUCTIVE_drop_legacy_category_columns.sql`) is the **destructive cutover**
— it drops the old free-text `category` columns. It is **staged, not applied**, and must
run only *after* the app is switched to write/read `<column>_code`. Its down-migration
re-adds the text column and rehydrates it from the lookup label.

---

## 5. LDP naming residue

Six text columns still carry the banned `_status` suffix (the Phase-6 pass caught bare
`status` but not these suffixed stragglers). **M4** (`04_ldp_status_to_state_renames.sql`)
renames them, carrying CHECK constraints/defaults over:

| Table | Old | New |
| --- | --- | --- |
| `budgets` | `budget_status` | `budget_state` |
| `automations` | `last_run_status` | `last_run_state` |
| `files` | `virus_scan_status` | `virus_scan_state` |
| `po_invoice_matches` | `match_status` | `match_state` |
| `document_state_transitions` | `from_status` | `from_state` |
| `document_state_transitions` | `to_status` | `to_state` |

Column renames break app references, so M4 is a **staged cutover** requiring a coordinated
code change (out of scope for this pass, which is schema-only). `push_send_failures.last_status`
and `webhook_deliveries.last_status` are **integer HTTP status codes**, correctly named —
left alone.

---

## 6. Review list (ambiguous — owner decision, no migration)

1. **`vendors.category`: `Staging` vs `Staging & rigging`** — same concept or two? Not
   collapsed. Decide the canonical vendor-category taxonomy before M3 drops the text col.
2. **`notifications.kind` mixes two conventions** — snake_case (`assignment_state`) and
   dotted event names (`invoice.paid`, `proposal.sent`), plus `incident` vs `incident.filed`
   near-dup. This column is governed by the `notification_kind_catalog` view and the app's
   `PushKind` union — normalizing it is an app+data change, not touched here.
3. **`event_guides.classification`** — 12 free-form ALL-CAPS strings that overlap the
   `guide_persona` enum. Decide: map onto `guide_persona`, or a new `ref_guide_classification`.
4. **Enum casing drift** — the same 8-phase vocabulary exists in three casings across three
   native enums (`production_phase` UPPER, `xpms_phase` Title, `xpms_atom_phase` lower); and
   `accounting_period_state` / `subscription_state` use UPPER labels against the lowercase
   house norm. Consolidating enum labels is app-coupled (`ALTER TYPE ... RENAME VALUE` +
   every string literal in code) — flagged as a separate project, not migrated.

---

## 7. What was NOT done (by design)

- No DDL/DML applied to the live database — this is discovery + staged files only.
- No app/business-logic edits (parallel agents are active; scope guard).
- No tables touched that are mid-flight in today's kit31/kit32 migrations.
- No fabricated taxonomy — lookup tables are seeded only from values already present.
