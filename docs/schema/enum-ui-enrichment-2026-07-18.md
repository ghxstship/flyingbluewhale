# Enum-Driven UI Enrichment — Inventory & Proposal (2026-07-18)

Read-only inventory of every list view and CRUD form touching enum-driven fields,
with proposed UI enrichments the lookup/FK structure unlocks. **No components have
been changed.** Nothing ships until the prioritized list below is approved.

Baseline enum vocabulary cross-checked against **XPMS 2.5** (`XPMS_2.5_SSOT_Bible.xlsx`
`dim_phase`/`dim_category`/`dim_discipline`; `xpms_supabase_migration.sql`).

Sibling artifacts: [enum-normalization-2026-07-18.md](./enum-normalization-2026-07-18.md)
(the lookup migration this builds on).

---

## 0. Headline findings

1. **The lookup structure only unlocks UI where `category` is still the primary field
   — which is essentially just `vendors`.** On `budgets` and `expenses`, `category`
   has already been superseded by XPMS `department`/`discipline` and is labelled
   "(Legacy)" in the forms; `certifications` has **no UI at all**; `onboarding_steps.category`
   is a hardcoded seed constant (`"packet"`), never user-chosen. So "surface the new
   structure" is a **targeted** job, not an app-wide sweep.

2. **Nothing reads the new tables yet.** Zero runtime references to `ref_*_category`
   or `category_code` anywhere in `src/app`/`src/components`/`src/lib`. Every surface
   still reads/writes the legacy free-text `category`.

3. **A ready-made enum SSOT is going unused.** `database.types.ts` exports a runtime
   `Constants` object with every native enum as an array — imported by **zero** UI
   files. Every hardcoded-option offender below duplicates it.

4. **The audit surfaced real bugs, not just enrichment gaps** (§4) — most notably a
   `budgets` edit path that silently NULLs `category` on every save.

5. **Repo enum content is behind XPMS 2.5** (§6): `xpms_phase` is 8 noun-form phases
   vs the standard's 9 verb phases (+ `Amplify`); `catalog_kind` misses `service`/
   `package`/`opex`. These are data/enum changes, flagged, out of this UI scope.

---

## 1. Per-table inventory — the 5 lookup-backed `category` columns

Treatment legend: FT = free-text input · HC = hardcoded `<option>`s · LK = lookup-fed · — = absent.

| Table | List treatment | Create | Edit | Writes | New structure unlocks | Priority |
|---|---|---|---|---|---|---|
| **vendors** | "Category" column, raw text, filter/group derive-from-data (`procurement/vendors/page.tsx:82`); detail subtitle; mobile "trade" (`m/companies`) | **FT** `Input` (`NewVendorForm.tsx:24`) | **FT** `Input` (`[vendorId]/edit/page.tsx:47`) | `category` text | **Real win** — category is the primary field | **P1** |
| **expenses** | fallback under "Department" col (`finance/expenses/page.tsx:106`); raw col on project finance; mobile `· {category}` | studio **FT** "(Legacy)"; **mobile HC** 7-opt select (`kit/forms.ts:222`) | studio **FT** "(Legacy)" | `category` text | Marginal — superseded by dept/discipline; mobile HC drifts from lookup | **P2** |
| **budgets** | fallback under "Department" col (`finance/budgets/page.tsx:66`); detail drives expense linking | **—** (uses `department` select) | **—** but action writes `category` → **NULLs it** | create: none; edit: null-clobber | None (deprecated) + a bug to fix | **P0 bug / P3** |
| **certifications** | **no UI** (0 `from("certifications")` call sites) | — | — | — | Nothing to enrich; table may be dead | **P4 / decide** |
| **onboarding_steps** | not displayed | — | — | seed const `"packet"` (`db/onboarding.ts:116`) | Nothing (not user-authored) | **skip** |

### Proposed enrichment — `vendors` (the one real win)

| Field | Current | Proposed |
|---|---|---|
| `category` (list column) | raw `category` text | show `ref_vendor_category.display_label`; keep font-mono code as tooltip |
| `category` (filter) | `DataTableInteractive` derives options from present rows | `FilterBar` facet fed from `ref_vendor_category` — **full domain incl. inactive** (historical rows stay findable), multi-select, ordered by `sort_order` |
| `category` (group-by) | groupable on raw value | group header = `display_label`, sections ordered by `sort_order` |
| `category` (create form) | free-text `Input` | `<select>`/`ui/Select` fed from `ref_vendor_category` **where is_active**, ordered by `sort_order`, storing `category_code` |
| `category` (edit form) | free-text `Input` | same select; when the row holds an inactive code, render it selected + labelled "(inactive)" so editing an old record round-trips |
| mobile `trade` (`m/companies`) | `v.category` raw | same lookup label |

> Open decision: keep writing legacy `category` in sync during a transition, or cut
> straight to `category_code`? (Ties to staged migration M3 which drops the text col.)

---

## 2. Broader enum fields on the rich surfaces (`budgets`, `expenses`)

The lookup migration touched only `category`, but these two lists carry the app's
densest enum payload and are where enrichment actually pays off. All are **native
enums / CHECK** already — the win is sourcing controls from the SSOT and adding
filter/sort/group, not new columns.

| Surface · field | Type | Current treatment | Proposed | Priority |
|---|---|---|---|---|
| budgets · `discipline` | enum `budget_discipline` (10) | — | FilterBar facet + group-by (`Constants.budget_discipline`) | P3 |
| budgets · `tier` | enum `budget_tier` (6) | — | facet + sortable col, ordered by tier index not alpha | P3 |
| budgets · `xyz` | enum `budget_xyz` (3) | — | facet (X/Y/Z constant/variable/timeline) | P3 |
| budgets · `line_type` | enum `budget_line_type` (7) | — | facet | P3 |
| budgets · `xpms_phase` | CHECK (8 noun) | `department` select uses hardcoded `XPMS_DEPARTMENTS` | phase facet ordered by **gate ordinal**, grouped by **act**; reconcile to XPMS 2.5 (§6) | P3 |
| budgets · `department` (form) | hardcoded `XPMS_DEPARTMENTS` const | source from `cost_centers` / dim_department | P3 |
| expenses · `discipline` | enum `budget_discipline` | typed select | facet + group-by | P3 |
| expenses · `expense_state` | enum `expense_status` | — | **state** facet (operational; distinct from phase) + status chip in list | P2 |
| expenses · `xpms_phase` | CHECK (8 noun) | typed select | phase facet, gate-ordered (§6) | P3 |
| expenses · `expense_type`, `method_of_payment`, `class` | **free text (no constraint)** | free text | candidates for the *next* normalization pass — not yet lookup-backed | flag |

---

## 3. Hardcoded-option offenders — migrate to SSOT first

The single highest-leverage fix: **adopt `Constants` (native enums) + `ref_*` (lookups)
as the option source** and delete the inline copies. Ranked shortlist (drift multiplier
noted); full list of 18 in the agent audit.

| # | Offender | Field | SSOT it should use | Why first |
|---|---|---|---|---|
| 1 | `leads/new/NewLeadForm.tsx:9` + `LeadStageMover.tsx:10` + `leads/actions.ts:159` | `lead_stage` | `Constants.lead_stage` | **triplicated** — worst drift risk |
| 2 | `m/roster/shared.ts:72` + `roster/letter-state.ts:41` | offer letter states | `Constants.offer_letter_status` | duplicated across mobile + studio |
| 3 | `api/v1/marketplace-listings/route.ts:11` + `[id]/route.ts:12` | listing state, condition | `Constants.listing_state` / `item_condition` | duplicated across routes |
| 4 | `procurement/vendors/[vendorId]/onboarding/OnboardingChecklist.tsx:27` + `actions.ts:11` | onboarding item state | enum | duplicated component+action |
| 5 | `projects/[projectId]/edit/page.tsx:64,133-190` | project_state, geo scope, tour structure, production style | 4 native enums | 23 inline options on one page |
| 6 | `m/expenses` kit `forms.ts:222` | expense category | `ref_expense_category` | HC options **don't match** the lookup seed — active drift |
| 7 | `settings/governance/Forms.tsx:43-115` | committee cadence, policy category | enums | policy category overlaps lookup intent |
| 8–18 | punch, visa, vetting, transport manifest, rfq, fulfillment, snag, task priority, capture source, marketplace calls, advances batch | various | matching enum / `FULFILLMENT_STATES` | single-site but each a live fork |

---

## 4. Correctness / drift bugs the audit exposed (fix independent of enrichment)

1. **`budgets` edit NULLs `category`.** `budgets/[budgetId]/edit/actions.ts:80` writes
   `category: data.category || null`, but `EditBudgetForm` has **no category field**, so
   every save clears it. Fix: drop `category` from the edit action (aligns with staged
   M3 that removes the column), or add the control. Recommend drop.
2. **Mobile vs studio expense category disagree.** Mobile offers Travel/Lodging/Meals/
   Fuel/Supplies/Equipment/Other; the lookup seed is av_rental/supplies/travel; studio is
   free text. Three vocabularies for one column. Needs one canonical set before wiring.
3. **`DataTableInteractive` filters show only values present in the current page**
   (`distinctValuesByKey:667`) — so a filter never exposes the full enum domain or an
   inactive-but-historical value. This defeats "keep inactive options visible in filters."

---

## 5. Primitive-level enablers (do these once, reuse everywhere)

- **`enumOptions()` / `Constants` adoption** — a tiny helper that turns a `Constants`
  enum array (or a `ref_*` lookup query) into `{value,label}[]` ordered by `sort_order`.
  This is the SSOT plumbing every offender in §3 plugs into.
- **`FilterBar` already takes a prop-fed `options` array** (`ui/FilterBar.tsx:20`) — it's
  the natural hang-point; today options are hand-built. Feed it from the helper.
- **`DataTableInteractive` needs an `optionDomain` prop** per filterable column so filters
  render the full lookup domain (incl. inactive) rather than distinct-present-values.
- **Lookup fetch pattern exists** only for `master_catalog_items` (`m/advances/new`);
  generalize it to the `ref_*` tables (server component → options prop).
- **`ref_*` tables carry no color/icon column** — if badge/color display is wanted (§ list
  display), add `color`/`icon` to the lookup shape in a follow-up migration.

---

## 6. XPMS 2.5 reconciliation (enum-content gaps — flagged, not UI)

- **Phase.** XPMS 2.5 = 9 **verb** phases, gate-ordered, act-grouped: Discover · Design ·
  Advance · Procure · Build · Install · Operate · **Amplify** (new) · Close. Repo
  `xpms_phase`/`production_phase`/`xpms_atom_phase` are 8 **noun** phases. Every phase
  control should order by **gate ordinal** and group by **act** (Depart/Sail/Return) — but
  the underlying enum needs the noun→verb + Amplify reconciliation first. A `dim_phase`
  lookup (gate/code/phase/act) would give the UI its `sort_order` + group key directly.
- **`catalog_kind`** missing `service`, `package`, `opex` vs the XPMS catalog.
- Source data itself has dirt (`active`/`Active`; `Z — Timeline/Phase` vs `-Phase`) —
  informational.

---

## 7. Cross-cutting consistency + phase/state distinction

- **`category` treated inconsistently across shells** (vendors: filter+group; expenses:
  fallback text; budgets: absent). Recommend one pattern: lookup label in list, lookup
  facet filter, lookup select in forms.
- **Respect phase vs state.** `xpms_phase` is a macro-arc **phase** (order by gate, group
  by act — a progression affordance). `expense_state`/`step_state`/`budget_status` are
  operational **states** (status chips, workflow filters). Do **not** merge them into one
  "status" control.
- **Default sort/group suggestions:** budgets list → group by `discipline`, sort by `tier`;
  expenses list → filter by `expense_state`, group by `department/discipline`; vendors →
  group by `category` (lookup).

---

## 8. Prioritized roadmap (awaiting approval)

- **P0 — bug fixes:** budgets edit null-clobber (§4.1); pick one canonical expense-category
  vocabulary (§4.2).
- **P1 — vendors:** wire `ref_vendor_category` into list column/filter/group + create/edit
  selects (§1). The one place the new structure clearly pays off.
- **P2 — expenses:** reconcile the 3 category vocabularies onto the lookup and feed both
  shells; add `expense_state` status chip + filter.
- **P3 — rich enum enrichment:** budgets/expenses facets + group-by on discipline/tier/
  phase; source `department`/phase selects from SSOT; adopt `Constants` (§2, §5).
- **P3 — offenders:** collapse the §3 shortlist to `Constants`/lookup, top-down by drift
  multiplier.
- **P4 — decide:** is `certifications` dead (drop) or does it need a net-new admin surface?
  `onboarding_steps.category` — leave as seed or promote to a real facet?

---

## 9. Implementation status (approved P0–P3, "retire category on budgets/expenses")

### Shipped & verified (typecheck 0 errors, lint clean, enum-sync guard passes)

**Foundation**
- `src/lib/enum-options.ts` — `enumOptions(name)` (native enums from `Constants`) + `humanizeToken` + `optionLabelMap`.
- `src/lib/enum-lookup.ts` — server `fetchLookupOptions(table, {includeInactive, ensure})` + `fetchLookupLabelMap` for the `ref_*` tables.
- `src/components/ui/OptionSelect.tsx` — labeled native `<select>` fed by `Option[]`.
- `database.types.ts` regenerated (typed `ref_*` tables + `category_code`); `Vendor` type in `types.ts` gained `category_code`.
- DB (applied + synced to numbered migrations): `20260718132544_enum_norm_expense_category_reconcile` (canonical expense-category vocabulary).

**P0** — `budgets` edit no longer NULL-clobbers `category` (write removed; column retired).

**P1 — vendors (full lookup wiring):** create + edit forms use `OptionSelect` from `ref_vendor_category` (active-only, `sort_order`, inactive stays selectable when editing); actions write `category_code` + mirror the label to legacy `category`; list shows the label + a lookup-driven `FilterBar` facet (full domain incl. inactive) with server-side `category_code` filtering; detail + mobile `m/companies` read the label off `category_code`.

**P2 — expenses:** studio create/edit `category` retired (superseded by XPMS dept/discipline); mobile expense form now injects lookup labels (no more hardcoded 7) and the action maps label → `category_code`; `expense_state` chip already present on the list.

**P3 (partial):**
- `lead_stage` collapsed from 3 inline copies (`NewLeadForm`, `LeadStageMover`, `leads/actions.ts`) onto the `Constants.public.Enums.lead_stage` SSOT.
- **Budgets list facets** — server-side `FilterBar` for discipline (`enumOptions("budget_discipline")`), tier (`enumOptions("budget_tier")`), phase (`XPMS_PHASES`, gate-ordered).
- **Expenses list facets** — server-side `FilterBar` for expense_state (`enumOptions("expense_status")`) + discipline.

### Remaining P3 (not done — each needs a decision, not a mechanical edit)

- **`projects/[id]/edit`** (project_state + geo/tour/production style, 23 options): the options are **i18n-labeled** (`t()` per value) and the set is **not duplicated** elsewhere, so collapsing onto `enumOptions` would lose localization for marginal drift benefit. Skipped by design; revisit only with a value-keyed `t()` helper.
- **CHECK-backed offenders** (`listing_state`, `item_condition`, punch/snag severity, visa/vetting): **not in `Constants`** — need a shared lib const (de-dup only) or promotion to a native enum / lookup. `listing_state` has two domains (`marketplace_listings` vs `event_listings`) under one name — don't unify blindly. Best folded into a continuation of the schema-normalization pass.
- **Offer-letter live states (×2)** are an FSM subset, not the full enum — collapse only with care for the state-machine logic.
- **Group-by `act` on the phase facet** needs the XPMS 2.5 phase reconciliation first (noun→verb + Amplify, §6); today the phase facet is gate-ordered over the existing 8 noun phases.
- **`DataTableInteractive` `optionDomain` prop** so its column filters render the full lookup/enum domain (incl. inactive) rather than distinct-present-values. No current consumer (vendors/budgets/expenses use `FilterBar`), so speculative until one needs it.

### Continuation — the two follow-ups, APPLIED (with deferrals)

- **XPMS 2.5 phase reconciliation — DONE & APPLIED** (`20260718150557` + `20260718150701`).
  `xpms_phase` enum + 7 CHECK columns → the 9 verb gates (Discovery→**Discover**,
  Procurement→**Procure**, +**Amplify** before Close). Verified 0 noun values remain. App
  code updated across both `XPMS_PHASES` SSOTs, `XpmsPhase`/`XpmsPhaseEnum`/`XpmsPhaseKey`
  types, `SPINE_PHASE_MAP`, `KIT_PHASES`/`KIT_PHASE_DEFS`, phase writes (reservations/
  proposals/draw template), + new `DIM_PHASE` SSOT (gate + act). Tests updated (`worlds-canon`,
  `xpms-portal-mapping`). Types regenerated. **Kept the DEPARTMENT `Procurement`** untouched
  (class name, not a phase). Deferred: `production_phase` (UPPER, fabrication) and
  `xpms_atom_phase` (lower, WBS atoms) — separate internal domains.

- **CHECK-offender promotion — FULLY APPLIED** (`20260718151325` + remediations
  `…152326` / `…152411` / `…152423`). Refined the ask: the offenders are **stable code sets**
  → **native enums** (land in `Constants`, unblock the UI collapse), not lookups; only evolving
  `service_requests.category` → lookup. All promoted:
  - `marketplace_listings.listing_state` + `item_condition` — dependency-free. UI: the
    ×2-duplicated marketplace API offender now sources from `Constants`.
  - **A** `punch_items.item_state` + `priority` — dropped/rebuilt view `v_action_items`
    (preserving `security_invoker`) + partial index `idx_punch_items_assignee`. UI: `punch/[id]/edit`
    page + action collapsed onto `Constants`.
  - **B** `service_requests.request_state` + `severity` + `service_sla_policies.severity`
    (shared `sla_severity`). The trigger `service_request_set_sla` is enum=enum-safe (no change).
    Real blocker was a **legacy CHECK name** (`service_requests_status_check`), not the trigger.
    UI: `services/requests` action severity collapsed onto `Constants`.
  - **C** `event_listings.listing_state` — dropped/recreated both RLS policies (same-table +
    cross-table `event_ticket_types_public_select`) with the enum-cast literal.
  - `service_requests.category` → `ref_service_request_category` lookup.

  Security advisor: no regression (no finding references any remediated object; `v_action_items`
  kept `security_invoker`). **Latent bug fixed:** `p/[slug]/delegation/cases` filtered
  `severity IN ('high','urgent')` against the P1–P4 scale — matched nothing — now `('P1','P2')`.

  > Lesson: CHECK→enum on a mature schema is *not* a bulk mechanical change. A text column can be
  > woven into views, RLS policies (incl. cross-table subqueries), trigger functions, **partial
  > index predicates**, and legacy-named CHECKs — each must be torn down and rebuilt around the
  > `ALTER TYPE`. `pg_depend` (with `refobjsubid = attnum`) is the authoritative dependency map.

### Notes / follow-ups
- Legacy `category` **reads** on budgets/expenses lists/detail were left intact (they still show values for un-migrated rows). They must be cleaned before staged migration **M3** drops the `category` columns.
- Live browser verification of authed `/studio` routes was not possible in this sandbox (unchanged `/studio` routes hang on the dev auth/Supabase flow too); verification here is typecheck + lint + guard tests + route isolation.
