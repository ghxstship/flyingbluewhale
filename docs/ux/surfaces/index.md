# Surface Spec Index — Pass 1

Source of truth for which surface specs exist, which are in review, and which are pending. See `docs/ux/discovery-report.md` for the inventory the order came from.

## Workflow

1. **Discovery** — read-only inventory of the target surface against `discovery-report.md`.
2. **Drafted** — spec file lives at `docs/ux/surfaces/{NN}-{slug}.md` per the template in the brief.
3. **In review** — owner has opened the spec; questions outstanding.
4. **Approved** — owner signed off in writing; spec is implementation-ready.
5. **Implemented** — Phase 2 code lands; spec moves to a maintenance state and divergence requires a spec update first.

A surface does **not** move from Drafted → Approved without owner review. Pass-1 order is sequential — do not start surface N+1 until N is Approved.

## Pass 1 priority

| #   | Surface                              | Spec                                                       | Shell                                                  | XPMS class       | Lifecycle owner                                                                                                                                  | Maturity today                       | Status                        | Owner        |
| --- | ------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ | ----------------------------- | ------------ |
| 1   | Projects (8PP phase board)           | [01-projects.md](./01-projects.md)                         | ATLVS                                                  | 0 EXECUTIVE      | `project_phase` (impl: `xpms_phase`)                                                                                                             | DEEP (detail) / TABLE+heatmap (list) | **Approved — 2026-05-24**     | _unassigned_ |
| 2   | Productions (fab + install)          | [02-productions.md](./02-productions.md)                   | ATLVS ↔ COMPVSS                                        | 4 BUILD / 5 PROD | `production_phase` (`fabrication_orders.production_phase`, SDK at `src/lib/production-phase.ts`)                                                 | TABLE-ONLY                           | **Approved — 2026-05-24**     | _unassigned_ |
| 3   | Assets / UAL (per-unit)              | [03-assets.md](./03-assets.md)                             | ATLVS + COMPVSS                                        | 5 PRODUCTION     | `asset_state` (impl: `equipment.status` → `ual_state`)                                                                                           | TABLE-ONLY                           | **Approved — 2026-05-24**     | _unassigned_ |
| 4   | Deliverables (advancing)             | [04-deliverables.md](./04-deliverables.md)                 | ATLVS + GVTEWAY + COMPVSS                              | 6 OPERATIONS     | `deliverable_state` (8 states, comment thread + history log)                                                                                     | TABLE-ONLY                           | **Approved — 2026-05-24**     | _unassigned_ |
| 5   | Run of Show (gated checkpoint board) | [05-run-of-show.md](./05-run-of-show.md)                   | COMPVSS-primary, ATLVS author + GVTEWAY view           | 5 PRODUCTION     | per-cue `cue_state` (impl: `cues.status` 5 states)                                                                                               | TABLE-ONLY                           | **Approved — 2026-05-24**     | _unassigned_ |
| 6   | Engagements + RDSP documents         | [06-engagements.md](./06-engagements.md)                   | ATLVS admin + COMPVSS onboarding + GVTEWAY counterpart | 6 OPERATIONS     | `engagement_state` (impl: `uis_roles.lifecycle_state`, distributed mirrors) + `document_state` (`offer_letters.status` 11 states + `msa_status`) | TABLE-ONLY                           | **Approved — 2026-05-24**     | _unassigned_ |
| 7   | Vendor CRM                           | [07-vendor-crm.md](./07-vendor-crm.md)                     | ATLVS                                                  | 0 EXECUTIVE      | `vendor_state` (proposed) + `prequalification_state` (existing)                                                                                  | TABLE-ONLY                           | **Drafted — awaiting review** | _unassigned_ |
| 8   | Venues                               | [08-venues.md](./08-venues.md)                             | ATLVS                                                  | 0 EXECUTIVE      | `handover_state` (existing; LDP-canonical name)                                                                                                  | TABLE-ONLY                           | **Drafted — awaiting review** | _unassigned_ |
| 9   | Catalog (UAC/TPC)                    | [09-catalog.md](./09-catalog.md)                           | ATLVS                                                  | 9 TECHNOLOGY     | `xpms_atoms.state` (uac/tpc) + `xpms_atoms.phase` (1-9)                                                                                          | DEEP (landing)                       | **Drafted — awaiting review** | _unassigned_ |
| 10  | Member subscription + booking        | [10-subscription-booking.md](./10-subscription-booking.md) | GVTEWAY (primary) + ATLVS                              | 0 EXECUTIVE      | `subscription_state` (8 LDP states, impl: `subscriptions.state`) + `talent_offer_status` (booking)                                               | TABLE-ONLY                           | **Drafted — awaiting review** | _unassigned_ |

## Out-of-pass-1 surfaces (logged, not specced this round)

Tracked so they don't fall off the radar; do not block Pass 1.

- Tasks / Action Items (already uses `KanbanBoard`)
- Operations / Incidents (already uses `KanbanBoard`)
- Punch list (already uses `KanbanBoard`)
- Procurement / RFQs / Purchase Orders / Submittals
- Schedule (Project tab — only existing `DataViewSwitcher` consumer)
- Finance (invoices / pay apps / expenses / budgets)
- Marketing / pipeline / sponsors / leads
- Workforce / time-off / shift-swaps / kudos
- Safety / inspections
- Settings (account managers / catalog / time-clock zones)
- All `/m` field surfaces beyond ROS + advancing
- All `/p/[slug]/<persona>` portal pages beyond crew advancing

## Rules of engagement

- Specs reference design tokens by name (`--org-primary`, `--surface-inset`, `--text-muted`) — never hex.
- Specs reference DB columns by current name and note the canonical LDP name in parens if they differ. Renaming columns is out of scope for this UX run; surface specs are forward-compatible with the rename.
- Specs cite at least 2 SaaS parity products per surface, with the specific pattern (not the product as a whole).
- Empty / loading / error states are concrete copy. No lorem.
- Reject "we have the lib so let's show the view" — every secondary view must map to a real business decision, justified inline.
