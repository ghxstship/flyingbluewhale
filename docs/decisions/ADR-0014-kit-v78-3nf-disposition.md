# ADR-0014 — Kit v7.8 §09 3NF merges: repo disposition

- **Status:** Accepted (2026-07-03) · **Amended same day by kit 20** — `ATLVS Ecosystem (20).zip` ships `design_handoff_console_rebuild/REPO_LANDING.md`, which removes the "recreate in the target environment" latitude this ADR leaned on: _"the prototype is the contract... where repo reality and prototype disagree, the prototype wins — the repo moves."_ Its Phase A mandates the table folds this ADR rejected or deferred, as real Supabase migrations (facet column → row migration → duplicate deleted → old route re-exposed as a filtered alias). The dispositions below stay as the honest audit of 2026-07-03; the **Rejected/Deferred rows are now the Phase A execution queue**, each to land as its own migration-scoped change (per the landing order's own "separate PRs" instruction) with RLS, `database.types.ts` regen, alias routes, sitemap/ia-map regen, and e2e updates. Sequencing note: `sub_invoices → invoices(source)` also carries the AP/PO linkage that completes the receiving 3-way match invoice leg (Phase B shipped the PO leg only).
- **Context:** The v7.8 console-rebuild kit (`ATLVS Ecosystem (18/19)`, `design_handoff_console_rebuild`) enforced "one noun · one store" on its own prototype registry by merging 12 duplicate entities into canonical stores behind filtered aliases (§09 post-pass), and demands the same law in any implementation (README Law #1/#3). This ADR dispositions each kit merge against the repo, where "stores" are real Postgres tables with RLS, not client-side registry arrays.

## Principle

The kit's law targets _duplicate stores of the same fact_. The repo's schema was normalized independently (LDP, ADR-0006/0011); several kit "merges" correspond to tables that hold **different facts that happen to share a label**. For those, the correct repo move is **label disambiguation** (the kit's own "Offers" precedent), not folding tables. Folding a real table into another is a schema migration with RLS/API/e2e blast radius and needs its own migration-scoped decision, not a nav cleanup.

## Disposition of the 12 kit merges

| Kit merge (§09)                            | Repo state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Disposition                                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `vendorContracts → contracts(scope)`       | One store: `contracts` at `/studio/legal/contracts`; people-side MSAs are a different fact (engagement terms)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | **Satisfied**; rail labels disambiguated 2026-07-03 (`Contracts` vs `Crew Contracts`)                               |
| `subNetwork → vendors(type)`               | Already a lens: subs network reads `vendors` + eligibility view (v7.5 subcontractor-ops)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | **Satisfied**                                                                                                       |
| `subCompliance → cois(scope)`              | Compliance vault reads vendor compliance records; one store                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | **Satisfied**                                                                                                       |
| `subInvoices → invoices(source)`           | ~~Rejected as-is~~ **Executed 2026-07-03** (kit 20 Phase A; `REPO_LANDING.md` §1 names this merge explicitly). Migrations `20260703170000` + `20260703170100` (+ `20260703171500` supersede) merged `sub_invoices` into `invoices` behind a `source` facet (`ar` / `ap_sub`) with `retainage_pct`, `lien_waiver_id`, `work_order_id`, and `purchase_order_id`; the waiver + approved-WO gates moved to DB triggers; `/studio/finance/sub-invoices` is now a filtered lens (incl. the Waiver Blocked view); the `match_receipt_three_way` RPC closes the 3-way-match invoice leg — see appendix below | **Satisfied** — one invoicing store, fact direction carried as a facet                                              |
| `leads + opportunities → crm(kind)`        | ~~Original claim: no separate `opportunities` store exists~~ — stale: the repo had grown a real `opportunities` store (`pipeline_definitions`/`pipeline_stages`, `/studio/pipeline`) alongside `leads`, i.e. two stores of the same pursuit fact                                                                                                                                                                                                                                                                                                                                                     | **Adopted** (Phase A amendment, 2026-07-03) — merged via `20260703150000_crm_merge_leads_kind`; see amendment below |
| `equipment + warehouse → inventory(class)` | **Executed 2026-07-03** (kit 20 Phase A): `equipment` folded into `assets` (the UAL canon) as `asset_class='fleet'` via migration `20260703120000_unified_inventory_assets` — facets `asset_class` (gear/fleet/lot) + `qty` + `disposition`; `rentals.equipment_id`→`asset_id`; `/studio/production/equipment` (Fleet) and `/studio/logistics/warehouse` (Lots) re-exposed as class lenses under the 9-tab `/studio/assets` family                                                                                                                                                                   | **Satisfied**                                                                                                       |
| `meetings → schedule(type)`                | ~~Deferred~~ **Executed 2026-07-03** (kit 20 Phase A): `meetings` folded into the schedule store (commit `bfe1a41`, migration `schedule_meetings_merge`)                                                                                                                                                                                                                                                                                                                                                                                                                                             | **Satisfied**                                                                                                       |
| `proofs → deliverables(type)`              | Creative proofs live in `deliverables` (doc-spec model) already                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | **Satisfied**                                                                                                       |
| `dateHolds → reservations(kind)`           | Reservations own holds/confirmations at `/studio/operations/reservations`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | **Satisfied**                                                                                                       |
| `sprints` deleted                          | Never existed in the repo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | **Satisfied**                                                                                                       |
| `myTasks` alias bound to current user      | `/studio/my-work` (v7.8 zero-training layer) is `session.userId`-bound                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | **Satisfied**                                                                                                       |
| `calendar → schedule(view)`                | `/studio/calendar` renders the schedule as a calendar view                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | **Satisfied**                                                                                                       |

## Rail-label dedup (Law #3: a noun appears once)

Five duplicate labels existed in `platformNav`; all five were **different stores**, so all five were disambiguated (2026-07-03), not folded:

| Was (×2)   | Now                                                    | Stores                                                                   |
| ---------- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| Reports    | `Reports` (cross-app library) / `Financial Reports`    | reports registry vs finance statements                                   |
| Documents  | `Documents` (doc-merge engine) / `Pages` (Collaborate) | 29-doc-type engine vs block docs (catalog keys updated in all 7 locales) |
| Warranties | `Warranties` (closeout) / `Warranty Reminders`         | `warranties` vs `warranty_reminders`                                     |
| Contracts  | `Contracts` (Procurement) / `Crew Contracts` (People)  | `contracts` vs MSAs                                                      |
| Payouts    | `Payouts` (Revenue) / `Vendor Payouts` (Finance)       | `event_payouts` vs vendor Connect status                                 |

## Record actions (kit's 22) — final Phase B accounting (2026-07-03)

Implemented as real chains (14): proposal→project (pre-existing) · estimate→budget · incident→corrective task · requisition→PO · requisition→RFQ · RFQ award→PO · reservation→event (commit a8b26c4) · PO route-to-approvals · PO change-order route-to-approvals · lead→proposal · asset check-out · asset check-in · submission→talent offer · receiving→3-way match (Phase B shipped the PO-marker leg; the Phase A `sub_invoices` merge completed the invoice leg — `matchReceiptToPoAction` now rides the `match_receipt_three_way` RPC, cross-patching the PO AND the linked invoice in one transaction).

Satisfied by existing mechanisms (4): crm convert-to-deal + mark-won (lead `stage` transitions via `moveLeadStageAction`) · time-off route-to-approvals (direct `decideTimeOff` + `approve_time_off_request` RPC is the earnable loop) · bookings add-to-lineup (the `talent_offers` state machine is the repo's booking loop; no lineup store exists — revisit with the events/ROS cycle).

Deferred with rationale (2): guest-list issue-credential (no guest-list detail surface; credential assignments require a `master_catalog_items` pick — needs its own UX pass) · permits log-evidence (no permits operational store; only the `dim_permit` warehouse dimension exists).

No backing store, prototype-only (1): lost-found match-return (no table; COMPVSS "Report It · Lost" intake covers the field need).

## Phase A queue (kit 20 mandate)

All four store merges executed 2026-07-03, each as its own migration-scoped landing (per the landing order's "separate PRs" instruction): `leads→crm(kind)` · `equipment+warehouse→inventory(class)` · `meetings→schedule(type)` · `sub_invoices→invoices(source)` — see the execution appendices below and the table above. Remaining queue: rail/tab verbatim alignment to `_ia-dump.md` (10 groups · 60 items · 140 routes) · screenshot parity (fixtures 04–09).

## Phase A execution — `leads + opportunities → crm(kind)` (2026-07-03)

The original "Satisfied in spirit" row rested on a claim that was stale by
2026-07-03: `/studio/pipeline` was NOT a saved view on `leads` — it read a real
`opportunities` store (with `pipeline_definitions`/`pipeline_stages`). Two
tables held the same pursuit fact, which is exactly the duplicate the kit's
C-11 merge targets. Executed as:

- **Store:** migration `20260703150000_crm_merge_leads_kind` — `opportunities`
  gains the `kind` facet (`crm_record_kind`: `deal` · `lead` · `rfp`, default
  `deal`), the lead columns (`lead_phase` reusing the `lead_stage` enum,
  `contact_email`, `contact_phone`, `notes`, `assigned_to`, `created_by`), and
  nullable `pipeline_id`/`current_stage_id` with CHECKs (deals must ride a
  pipeline stage; leads must carry `lead_phase`). All `leads` rows migrated
  id-preserving with `kind='lead'`; the `leads` table is dropped. RLS carries
  the role-banded policy set `leads` had (member select; owner/admin/manager/
  controller/collaborator write; owner/admin delete) — replacing the broader
  single ALL policy.
- **Routes:** `/studio/crm` is the canonical one-store surface; `/studio/leads`
  (kind=`lead`) and `/studio/pipeline` (kind=`deal`, by pipeline stage) are
  filtered lenses. Detail pages cross-redirect on kind so a converted record's
  deep links land on its current lens. `moveLeadStageAction` and the lead CRUD
  now write the merged store (`lead_phase`).
- **`rfp` facet:** reserved by the enum for the RFP pursuit lane (kit
  "Opportunities" tab); no rows carry it yet — procurement RFQs remain their
  own sourcing fact and are NOT folded here.
- **Record actions preserved:** `moveLeadStageAction` writes `lead_phase`;
  the Phase B lead→proposal chain (`createProposalFromLeadAction`, `[lead:<id>]`
  marker) reads the merged store — marker and proposal lineage unchanged.

## Phase A execution — `sub_invoices → invoices(source)` (2026-07-03)

The original "Rejected as-is" row leaned on the AP/AR fact-direction split;
kit 20's REPO_LANDING §1 names this merge explicitly, so direction became a
facet, not a table boundary. Executed as:

- **Store:** migrations `20260703170000_invoice_ap_source_facet` +
  `20260703170100_merge_sub_invoices_three_way_match` (+
  `20260703171500_drop_sub_invoices_supersede_repair`, which re-dropped the
  table after a parallel session's "partial apply repair" resurrected it).
  `invoices` gains `source` (`ar` default · `ap_sub`), `vendor_id`,
  `work_order_id`, `purchase_order_id`, `retainage_pct`, `lien_waiver_id`,
  `approved_at`; the `invoice_status` enum gains the AP arc
  (`submitted → approved|rejected → paid`). All `sub_invoices` rows migrate
  id-preserving as `source='ap_sub'` (`SI-<id8>` numbers); the table is
  dropped.
- **Gates (DB triggers):** `trg_invoices_ap_wo_gate` — an `ap_sub` invoice
  may only be created against an approved work order (ported from P3);
  `trg_invoices_ap_waiver_gate` — an `ap_sub` invoice cannot reach `paid`
  until its linked `lien_waivers` row is signed/returned/released. 3NF: the
  waiver badge derives from the `lien_waiver_id` join, never denormalized.
- **Routes:** `/studio/finance/invoices` is the canonical one-store surface
  (Source column: AR · AP · Sub); `/studio/finance/sub-invoices` is the AP
  lens with the Waiver Blocked saved view (`?view=blocked`) and the
  request-waiver unblock path. AR revenue math (finance hub, gross-margin +
  DSO report resolvers) filters `source='ar'` — a paid sub invoice is cost.
- **3-way match invoice leg:** `po_invoice_matches` gains `invoice_id`
  (`invoice_tx_id` now nullable); the `match_receipt_three_way(receipt,
invoice)` SECURITY DEFINER RPC computes the verdict
  (full/over/partial/qty_variance), upserts the match row, and — in one
  transaction — advances the PO (`state→matched`, `po_state→fulfilled`) and
  approves the submitted AP invoice. `matchReceiptToPoAction` (receiving
  detail) now rides this RPC, superseding the Phase B PO-marker-only patch.

## Consequences

- The rail satisfies Law #3 with zero label collisions — guarded by `src/lib/nav-labels.test.ts` (uniqueness + full `sub` coverage + lens integrity + no em/en dashes).
- All four Phase A store merges are executed (crm · inventory · schedule · sub-invoices); the remaining kit 20 queue is rail/tab verbatim alignment to `_ia-dump.md` and screenshot parity.
