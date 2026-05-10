# ADR-0003 — R-LDP-v2-4 step 3: enum casing normalization

**Status:** Accepted
**Date:** 2026-05-09
**Owner:** Platform engineering
**Supersedes:** —
**Source plan:** [reports/LDP_REMEDIATION_PLAN_v2.md](../../reports/LDP_REMEDIATION_PLAN_v2.md) §R-LDP-v2-4
**Backlog status before this ADR:** [reports/LDP_V2_BACKLOG_EXECUTION.md](../../reports/LDP_V2_BACKLOG_EXECUTION.md) — v2-4 listed as Wave 2 deferred

## Context

R-LDP-v2-4 ("Engagement-Document Lifecycle: rename + casing fix") is a
Wave 2 item with four sub-steps:

1. `ALTER TYPE offer_letter_status RENAME TO document_state`.
2. `ALTER TABLE offer_letters RENAME COLUMN status TO state`.
3. **Normalize enum value casing** — currently mixed (`draft, sent, viewed,
accepted, COUNTERSIGNED, ACTIVE, declined, withdrawn, expired, SUPERSEDED,
VOIDED`); pick one (plan suggests lowercase to match legacy values),
   migrate values, drop old.
4. Repeat for `proposals.status` → `proposal_status` if it conforms to
   LDP §6, or document why it remains a separate lighter-weight document
   machine.

The plan flagged step 3 as the destructive piece — Postgres can't drop enum
values, so it requires DROP VIEW CASCADE + type recreation + view rebuild.
The Wave 2 backlog deferred it pending a rollback plan.

This ADR records execution of **step 3 only**. Steps 1, 2, and 4 remain
Wave 2 work owned by the existing remediation plan.

## Decision

Execute step 3 now. Direction: all-lowercase, per the plan's recommendation.

The execution preconditions are favorable and degrade with time:

- 18 prod rows total, all already at lowercase legacy values
  (`draft` ×5, `sent` ×10, `withdrawn` ×3).
- All PL/pgSQL function literals (`accept_offer_letter`,
  `decline_offer_letter`, `record_offer_letter_view`) use lowercase.
- Column default is `'draft'::offer_letter_status` (lowercase).
- No application code references the four UPPERCASE labels
  (`COUNTERSIGNED`, `ACTIVE`, `SUPERSEDED`, `VOIDED`) — confirmed via
  `grep -rn` across `src/` and `supabase/`. The hand-rolled
  `OfferLetterStatus` in [src/lib/offer-letters/types.ts](../../src/lib/offer-letters/types.ts)
  remains scoped to the 7 product-supported statuses; the new values are
  DB-level availability for future flows.
- Generated `database.types.ts` updated to the 11-label all-lowercase union.

Migration:
[supabase/migrations/20260509070000_normalize_offer_letter_status_casing.sql](../../supabase/migrations/20260509070000_normalize_offer_letter_status_casing.sql).
Numbered to run after `20260509000002_ldp_enum_extensions.sql` and
`20260509060000_ldp_lifecycle_remediations_reconciled.sql` so that on a
fresh DB the UPPERCASE labels are added first and then collapsed to
lowercase by this migration. On the live DB the migration tracker prevents
re-application, so the lowercase state is stable.

Branch dry-run was unavailable (Supabase Free plan; branching is Pro+).
Applied directly to main given the audited dependency surface and the
fact that the operation is wrapped in a single transaction.

## Out of scope

This ADR does not opine on the other deferred items
(R-LDP-v2-1, v2-3b, v2-5, v2-8). Those are owned by
[LDP_REMEDIATION_PLAN_v2.md](../../reports/LDP_REMEDIATION_PLAN_v2.md) with
existing wave assignments and effort estimates. Re-litigating them inside
this ADR would create competing sources of truth.

The remaining v2-4 sub-steps (TYPE rename to `document_state`, COLUMN
rename to `state`, proposals parity) are Wave 2 work tracked in the same
plan and not addressed here.

## Consequences

- v2-4 is now blocked only on the rename pieces (steps 1, 2, 4), not on
  the destructive casing rebuild. When the rename PR lands, the
  precondition list shrinks to "is the column rename worth the consumer
  refactor cost" without the destructive-DDL gate clouding the decision.
- The pattern used here — "low-volume, fully-audited, transactional enum
  rebuild without a branch dry-run" — is reusable for the remaining
  Wave 2 destructive pieces if branching stays unavailable. Audit
  checklist: dependent views / column defaults / functions referencing
  the type / RLS policies / check constraints / app-code literals.
- The four UPPERCASE labels ceasing to exist is a behavioral change for
  any future code that intends to write them. New lifecycle code must use
  the lowercase forms.

## Re-open trigger

Step 3 is one-way; the only re-open trigger is "the lowercase direction
was wrong." That decision was made by the source plan and is unlikely to
flip. If the rename steps (1, 2, 4) reveal that `proposals` should NOT
conform to LDP §6, the proposals enum can be re-cased independently.
