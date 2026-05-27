# Surface Spec #7 — Vendor CRM

**Shell:** ATLVS · **Route:** /console/procurement/vendors (master directory) + /console/procurement/vendors/[vendorId]/\* (detail with tabs prequalification/pos/submittals/scorecard) + /console/pipeline (opportunity pipeline) + /console/leads + /console/clients (sales-side parties)
**Status:** Drafted · awaiting review — stop signal per brief
**Theme:** Bermuda Triangle only. ATLVS pink throughout.

## 1. Data class & lifecycle

| Item                          | Value                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conceptual XPMS class         | **0 EXECUTIVE — Procurement** (vendors, sourcing, RFQs, prequalification) and **3 MARKETING — CRM** (leads, opportunities, clients). Per ADR-0004 the two classes are different sidebar groups; this surface spec consolidates them at the **data-class** level (both are "outside party with a deal pipeline") because the underlying lifecycle vocabulary is identical. |
| Primary lifecycle             | **`vendor_state` (PROPOSED — does not exist today)** — clean macro arc per LDP discipline: `discovered → invited → prequalifying → approved → preferred → suspended → archived`. 7 states. Used to express "where is our relationship with this vendor right now" independent of any particular open deal.                                                                |
| Secondary lifecycle (channel) | **`vendor_prequalifications.status`** — 7 states already shipped (`invited / in_progress / submitted / approved / approved_conditional / rejected / expired`) per `0001_remote_snapshot.sql:6578`. The prequalification cycle is one channel within the larger vendor relationship.                                                                                       |
| Opportunity lifecycle         | **`pipeline_stages`** — per-org, per-pipeline configurable stages (each with `is_won` / `is_terminal` / `display_order`). `opportunities.current_stage_id` is the per-row state. Already implemented at `/console/pipeline`. This is the deal-shape lifecycle layered on top of the vendor record.                                                                        |
| Compliance attributes         | `vendors.w9_on_file boolean`, `vendors.coi_expires_at date`, `vendors.payout_account_id` (Stripe Connect). Currently shown as inline chips on the list — surface keeps them but elevates to a per-vendor compliance score in the detail header.                                                                                                                           |
| Adjacent tables               | `clients` (the buy-side counterpart), `leads` (top-of-funnel), `pipelines` / `pipeline_stages` / `opportunities`, `purchase_orders` / `po_line_items` (transactions), `submittals` / `submittal_items` (deliverable-attached), `vendor_prequalification_answers`, `rfqs` / `rfq_responses` (marketplace canon).                                                           |
| Authority docs                | `docs/decisions/ADR-0004-xpms-native-nav.md` (EXECUTIVE-Procurement + MARKETING cells), `docs/XPMS_TO_ATLVS_MAPPING.md` URM row, `supabase/migrations/0001_remote_snapshot.sql:6585` (vendors), `0001_remote_snapshot.sql:6564` (vendor_prequalifications), `src/app/(platform)/console/pipeline/page.tsx`, CLAUDE.md "Marketplace (0002)" section.                       |

**Two-axis truth.** Vendor relationship = the macro arc (`vendor_state`, slow-moving, multi-year). Opportunity = the in-flight deal (per-row state in `pipeline_stages`, days-to-weeks). The two coexist: one vendor can have N opportunities. The surface renders both axes — vendor master = "who they are to us", opportunity pipeline = "what's in flight right now."

## 2. SaaS parity targets

Per brief: HubSpot lists, Pipedrive pipeline, Salesforce account view. Specific patterns:

| Product                 | Specific pattern to match or exceed                                                                                                                                                                                          | Why it applies                                                                                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HubSpot Lists           | Saved-list primitive that's a first-class object (named, sharable, has a URL). Companies list = the master directory; per-list filters + bulk actions; "Add to list" affordance on any company row. The list IS the segment. | Vendors are segments-of-segments (preferred / specialty trade / regional / in-prequal). The "list" object pattern formalizes a saved-view-as-named-list with its own URL. |
| Pipedrive               | Pipeline kanban — stages = columns, deals = cards, drag to advance, "stuck > N days" highlight per stage. Forecast totals at lane header (sum of value × probability).                                                       | Direct fit for the opportunity pipeline at `/console/pipeline` (already partly built). Forecast rollup is a marquee gap.                                                  |
| Salesforce Account view | "Account 360" — left = identity, center = activity feed, right rail = open deals / open POs / open tasks. Every related-entity drawer surfaced on one page.                                                                  | The vendor detail page becomes this — every PO, RFQ, submittal, opportunity, prequalification surfaced inline rather than across tab navigation.                          |
| Attio                   | "Records" with relations — every entity (Person, Company, Deal) has typed relations to others; click any relation to traverse. Filter by relation.                                                                           | Maps cleanly to vendors ↔ opportunities ↔ POs ↔ submittals. Traversal-by-click on the detail page mirrors Attio's record-graph navigation.                                |
| Affinity                | Activity score per account — auto-tracked from email/meeting density. "Warm vendors we haven't talked to in 90 days" report.                                                                                                 | We don't have email tracking but we DO have `conversations` table (vendor `record_type` per `0001:2968`). Same primitive, internal-only data source.                      |

**Rejected references:** SAP SRM (over-rotated to procurement compliance; we want the SDR-toolkit vibe). Coupa (too tail-spend focused). Excel vendor lists (the shape we're replacing).

## 3. Primary view

The surface ships **two lens-routes** sharing the same data class. Operator picks based on intent.

### 3.1 `/console/procurement/vendors` — Master Directory (default = State-filtered table)

Same pattern as Surface #3 (Assets): high-volume directory + tile strip + filter chips. **State tile strip** runs across the 7 `vendor_state` values; tile click toggles the state filter.

Columns (default): name · category · `vendor_state` pill · primary contact · COI expiry chip (red when <30d) · W-9 chip · open POs count · open opps count · last activity (relative).

Hover reveals row-actions: Open detail · Add to list · Invite to prequalify · New opportunity · Send RFQ.

### 3.2 `/console/pipeline` — Opportunity Pipeline (default = Kanban by `pipeline_stage`)

Already exists as kanban-shaped; spec extends it. Lanes = `pipeline_stages` ordered by `display_order`. Won-lane has `--color-success` accent; terminal-lost has `--color-error`. Lane header carries: count · forecast total (Σ `estimated_value_minor × probability/100`) · stuck-count badge (deals not advanced in lane-specific SLA days).

Cards: title · account (vendor name + small chip) · value (mono compact) · probability · expected close (relative) · next activity (mono, e.g. "Call in 3d").

Drag to advance (forward + adjacent only — same rule as Surfaces #1/#2/#4); cross-lane regression requires reason via detail.

Both lens-routes share the same filter chips, saved views, and `<DataViewSwitcher>` (allowed views differ — see §4).

## 4. Secondary views

| View                       | When operator uses it                                                                                                                                                                              | Source                                                                           | Verdict                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `board` (vendors)          | "What's in prequal right now" — kanban by `vendor_state`. 7 lanes flatten to 3 super-lanes: COURT (discovered, invited, prequalifying) · ACTIVE (approved, preferred) · END (suspended, archived). | `vendors.vendor_state`                                                           | **Accept**                                                          |
| `table` (opportunities)    | Bulk: reseat pipeline, reassign owner, bulk-export forecast.                                                                                                                                       | `opportunities` + joined account.                                                | **Accept**                                                          |
| `timeline` (opportunities) | Forecast timeline — bars from `created_at` to `expected_close`, tinted by stage. "Q4 forecast" view.                                                                                               | `opportunities.{created_at, expected_close, estimated_value_minor, probability}` | **Accept**                                                          |
| `map` (vendors)            | Vendors with `vendors.location_id` placed geographically. "Who's local to this venue?" question at sourcing time.                                                                                  | `vendors.location_id → locations.{lat,lng}`                                      | **Accept (conditional)** — ships when ≥1 vendor has a location set. |
| `directory` (flat)         | "I just need to find Acme Lighting's email" — the simplest search-and-jump mode. Bypass the state framing entirely.                                                                                | flat vendors                                                                     | **Accept**                                                          |
| `gallery` / `tree`         | Reject for both lenses. Vendors are not visual; no parent/child hierarchy.                                                                                                                         | n/a                                                                              | **Reject**                                                          |
| `calendar`                 | Reject. Opportunity close dates are too sparse for a calendar; timeline does this better.                                                                                                          | n/a                                                                              | **Reject**                                                          |

Allowed sets:

- Vendors lens: `["table", "board", "directory", "map"]`. Default `table`.
- Pipeline lens: `["board", "table", "timeline"]`. Default `board`.

Filter chips (shared vocabulary across both lenses):

- Vendor state (multi)
- Category (typeahead, multi)
- Compliance flags: W-9 missing · COI expiring ≤30d · No prequalification on file
- Pipeline stage (multi — only meaningful in pipeline lens)
- Pipeline (single — when org has >1 pipeline)
- Forecast window (preset chips: This Quarter · Next Quarter · This Year)
- Owner (typeahead — opp owner)
- Source / channel (multi — `opportunities.source`)
- "Stuck > Nd" toggle

Saved views (HubSpot Lists pattern — each has a URL):

- "Preferred Vendors" — `vendor_state = preferred`.
- "COI Expiring 30d" — `coi_expires_at <= today+30`.
- "Prequalifying" — `vendor_state = prequalifying`.
- "Warm — no contact 90d" — last `conversations` row >90d AND `vendor_state` IN (approved, preferred).
- "Q4 Pipeline" — `expected_close BETWEEN Q4 start/end`.
- "Won This Quarter" — current stage `is_won = true`, `won_at` this quarter.

## 5. Lifecycle visualization

| Surface element                  | Pattern                                                                                                                                                                                                                        | Visual                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Vendor list — tile strip         | 7 `vendor_state` tiles. Click toggles filter.                                                                                                                                                                                  | `<StateTileStrip>` (from Surface #3).                         |
| Per-row vendor state pill        | `<StatusBadge state={vendor.vendor_state} />`                                                                                                                                                                                  | Existing.                                                     |
| Vendor detail header             | `<PhaseStepper enum="vendor_state" current={…} onAdvance={…} />` — 7-step horizontal stepper. Generalized primitive from Surfaces #3–6.                                                                                        | Generalized PhaseStepper.                                     |
| Pipeline kanban — stage chips    | Lane chip in `pipeline_stages` accent (tone driven by `is_won` / `is_terminal`).                                                                                                                                               | Inline.                                                       |
| Compliance score chip            | Per-vendor 0–100 score = weighted of (W-9 on file, COI valid, prequalification approved, no open submittal failures). Surfaced on directory rows + detail header.                                                              | New `<ComplianceScoreChip>`. Green ≥80, amber 50–79, red <50. |
| Activity rollup                  | `LdpStateTimeline` consuming `v_vendor_activity` UNION view: `conversations` ∪ `purchase_orders` events ∪ `prequalification` state changes ∪ `opportunity` stage changes.                                                      | Existing primitive + new view.                                |
| Bridge to Surface #6 Engagements | When a vendor's `vendor_state` advances to `approved`, the system creates a `uis_roles` row with `role_class='build_vendor'` (or appropriate) and `lifecycle_state='confirmed'`. The two surfaces now share a Party reference. | Trigger or RPC.                                               |

## 6. RBAC affordances

Predicate: `canTransitionVendor(session, vendorRow, fromState, toState)` added to `src/lib/auth/policy.ts`.

| Action                              | Owner | Admin | Manager              | Member            | Treatment                                                                                                               |
| ----------------------------------- | ----- | ----- | -------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| View vendor directory / pipeline    | ✓     | ✓     | ✓                    | ✓ (RLS)           | **Shown.**                                                                                                              |
| Open vendor detail                  | ✓     | ✓     | ✓                    | ✓ (RLS)           | **Shown.**                                                                                                              |
| Create vendor                       | ✓     | ✓     | ✓                    | —                 | **Hidden** for member.                                                                                                  |
| Advance vendor state forward        | ✓     | ✓     | ✓ (up to `approved`) | —                 | **Shown** for owner/admin; manager only up to `approved`. Promotion to `preferred` is an org-policy call (owner/admin). |
| Regress within super-lane           | ✓     | ✓     | ✓                    | —                 | Shown.                                                                                                                  |
| Suspend (any → suspended) / Archive | ✓     | ✓     | —                    | —                 | **Hidden** for manager + member.                                                                                        |
| Invite to prequalify                | ✓     | ✓     | ✓                    | —                 | **Shown** manager+.                                                                                                     |
| Approve / Reject prequalification   | ✓     | ✓     | —                    | —                 | **Hidden** for manager; this is a compliance act.                                                                       |
| Create opportunity                  | ✓     | ✓     | ✓                    | ✓ (own pipeline)  | **Shown** based on per-pipeline assignment.                                                                             |
| Advance opportunity stage           | ✓     | ✓     | ✓                    | ✓ (own opp owner) | **Shown** for opp owners + manager+.                                                                                    |
| Mark won / lost                     | ✓     | ✓     | ✓                    | ✓ (owner)         | **Shown** for opp owner + manager+. Audit log fan-out.                                                                  |
| Bulk operations                     | ✓     | ✓     | ✓                    | —                 | **Shown** manager+.                                                                                                     |
| Delete vendor                       | ✓     | ✓     | —                    | —                 | **Detail page only** with typed-name confirm.                                                                           |

## 7. Empty / loading / error states

| State                                              | Copy                                                                                                                                                                             | Visual          |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Empty — no vendors                                 | Title: "No Vendors Yet" · Body: "Onboard your first supplier — W-9, COI, payment terms — before issuing POs." · CTA: "+ New Vendor" · Secondary: "Import CSV"                    | `<EmptyState>`. |
| Empty — no opportunities                           | Title: "No Deals In Flight" · Body: "An opportunity is one in-flight deal with a vendor or client. Author your first to see the pipeline take shape." · CTA: "+ New Opportunity" | `<EmptyState>`. |
| Empty lane (pipeline)                              | Inline: "Nothing in {stage}." Drop target = the empty lane.                                                                                                                      | Inline muted.   |
| Empty filter result                                | Inline: "No vendors match those filters." · "Clear filters."                                                                                                                     | Inline.         |
| Loading                                            | Skeleton variants (`table` for vendors, `board` for pipeline).                                                                                                                   | Existing.       |
| Optimistic stage move failure                      | Toast: "Couldn't move {opp.title} to {stage}. The change was rolled back."                                                                                                       | Sonner.         |
| TOCTOU                                             | Toast: "{vendor.name} was updated a moment ago — refresh."                                                                                                                       | Sonner.         |
| Approve prequalification without conditions filled | Inline dialog error: "Add at least one condition before marking as Approved Conditional."                                                                                        | Inline.         |

## 8. Bulk actions, filters, saved views, keyboard nav

| Capability   | Spec                                                                                                                                                                                                                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bulk actions | Vendors table: Add to list · Bulk invite to prequalify · Bulk reassign owner · Bulk send RFQ · Bulk export CSV · Bulk archive (owner/admin). Pipeline table: Bulk advance stage (forward adjacent) · Bulk reassign owner · Bulk update expected close · Bulk export forecast.       |
| Filters      | Chip strip per §4. URL-stateful.                                                                                                                                                                                                                                                    |
| Saved views  | HubSpot Lists pattern — each saved view has its own URL fragment (e.g. `/console/procurement/vendors?list=preferred-vendors`). Per-user + org-share. "Add to list" is a row-action affordance.                                                                                      |
| Keyboard nav | ⌘K: vendor or opportunity by name. `J`/`K` next/prev in lane. `A` advance forward. `[`/`]` switch view. `g v` / `g p` jump to vendor / pipeline routes. On vendor detail: number keys jump to tabs (1=Overview · 2=Prequal · 3=POs · 4=Submittals · 5=Scorecard · 6=Opportunities). |

## 9. Mobile / narrow viewport behavior

ATLVS console is desktop-primary for CRM workflows. ≤768px: tile strip wraps; pipeline kanban → horizontal scroll super-lane mode; bulk hidden; row actions → row tap → bottom sheet. No mobile-primary entry for this surface (field crew don't manage CRM).

## 10. Surface composition

| Path                                                                      | Change                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/(platform)/console/procurement/vendors/page.tsx`                 | Replace plain table with view resolver + tile strip + filter chips + saved view selector. Read `vendor_state` column (added by migration below).                                                                                                                                                 |
| `src/app/(platform)/console/procurement/vendors/VendorDirectoryTable.tsx` | **New.** DataTable with column set.                                                                                                                                                                                                                                                              |
| `src/app/(platform)/console/procurement/vendors/VendorBoard.tsx`          | **New.** KanbanBoard by `vendor_state`, super-lane mode.                                                                                                                                                                                                                                         |
| `src/app/(platform)/console/procurement/vendors/VendorMap.tsx`            | **New.** MapView conditional on location data.                                                                                                                                                                                                                                                   |
| `src/app/(platform)/console/procurement/vendors/[vendorId]/page.tsx`      | Rework to Salesforce Account 360: identity left, activity center (`<LdpStateTimeline>` on `v_vendor_activity`), right rail = open opps / open POs / open prequalifications / compliance score.                                                                                                   |
| `src/app/(platform)/console/pipeline/page.tsx`                            | Extend existing kanban: lane forecast totals + stuck chips + saved-view selector + cross-link to vendor row.                                                                                                                                                                                     |
| `src/components/crm/ComplianceScoreChip.tsx`                              | **New.**                                                                                                                                                                                                                                                                                         |
| `src/components/crm/PipelineCard.tsx`                                     | **New.** Opportunity card chrome.                                                                                                                                                                                                                                                                |
| `src/lib/db/vendors.ts`                                                   | **New.** `listVendors`, `getVendor`, `advanceVendorState`, `listVendorActivity`.                                                                                                                                                                                                                 |
| `src/lib/db/opportunities.ts`                                             | **New.** CRUD + `advanceStage` honoring `is_won` / `is_terminal`.                                                                                                                                                                                                                                |
| `src/lib/auth/policy.ts`                                                  | Add `canTransitionVendor`, `canAdvanceOpportunity`.                                                                                                                                                                                                                                              |
| `supabase/migrations/{next}_vendor_state.sql`                             | **New.** Add `vendors.vendor_state vendor_state NOT NULL DEFAULT 'discovered'`. New enum `vendor_state` (7 values per §1). Backfill: `approved` for any vendor with `w9_on_file = true AND coi_expires_at > today`, else `discovered`. Add `vendor_state_transitions` append-only log + trigger. |
| `supabase/migrations/{next}_v_vendor_activity.sql`                        | **New.** UNION view: `vendor_state_transitions` + `conversations` (vendor record_type) + `purchase_orders` events + prequalification state changes + opportunity stage changes.                                                                                                                  |
| `supabase/migrations/{next}_phase_advance_policy_vendor_kind.sql`         | **Extension** to unified `phase_advance_policy` from Surface #2 Resolution #7. Adds `phase_kind='vendor'`.                                                                                                                                                                                       |

## 11. Acceptance

1. Operator advances a vendor from `prequalifying → approved` in ≤2 clicks via ⌘K.
2. Pipeline lane header shows forecast = Σ(value × probability) updated on every drag.
3. "COI Expiring 30d" saved view renders in ≤300ms and is shareable via URL.
4. Bulk-invite 10 vendors to prequalify in one action; 10 `vendor_prequalifications` rows in `invited`; 10 push/email fan-outs.
5. Vendor approved auto-creates `uis_roles` row (Surface #6 bridge).

## 12. Resolutions — 2026-05-24

1. **New `vendor_state` column vs derive from existing flags?** **Add the column.** Derived state is fragile under multi-criterion changes (W-9 added + COI expired same day = ambiguous derivation). Explicit column + transition log is the LDP-canonical shape.
2. **Vendors and clients — same surface?** **No.** Clients live at `/console/clients` (covered out-of-pass-1 by intent); vendors at `/console/procurement/vendors`. Different lifecycles (clients have proposals; vendors have prequalifications + POs). Opportunities consume both — a unified party model is the future-fit cleanup, not this surface.
3. **Pipeline stages per-org or global?** **Per-org per-pipeline** (already shipped). Future-flexibility: a `pipeline_template` library can ship if/when many orgs converge.
4. **Forecast formula — value × probability, or per-stage default probability?** **Hybrid.** `opportunities.probability` if set, else `pipeline_stages.default_probability` (new column). Lets stages prescribe a default while preserving per-deal override.
5. **`<ComplianceScoreChip>` weights — hardcoded or config?** **Per-org `compliance_score_policy` row** (`{w9_weight, coi_weight, prequal_weight, ...}`). Default seed. One-INSERT to tune.
6. **List object — saved view or first-class table?** **Saved view with named URL** for now; promote to first-class table only if N>50 org-wide lists land. Premature first-class objects = data model churn.

---

**Phase 2 ready.**
