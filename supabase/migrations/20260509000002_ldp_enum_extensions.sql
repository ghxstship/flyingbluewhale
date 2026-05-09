-- SUPERSEDED 2026-05-09 by 20260509060000_ldp_lifecycle_remediations_reconciled.sql.
-- Pre-flight against the live remote schema (xrovijzjbyssajhtwvas) showed
-- USNP canon (shipped 2026-05-08) already implements most of LDP §3/§5/§7:
--   - LDP §5 Engagement → uis_roles.lifecycle_state uis_lifecycle_state
--   - LDP §3 Asset → asset_movements (ual_state-typed)
--   - LDP §7 Financial Period → accounting_periods
-- The reconciled migration ships only the genuinely net-new bits and
-- skips work USNP canon already covers. THIS FILE IS NOT APPLIED.
-- Kept in repo as an audit artifact of the original LDP-naive proposal.

-- LDP Phase 5 remediation, batch 2: extend existing enums to LDP-canonical state sets.
--
-- ALTER TYPE ... ADD VALUE cannot be used inside a transaction block when the
-- new value will be referenced in the same transaction. This migration adds
-- values only; consumers continue to use the existing column types.
--
-- LDP §3 Asset: equipment_status (currently 5 values) gains ACQUIRED, IN_TRANSIT,
-- RETURNED, LOST to reach the canonical 9-state machine. Existing values keep
-- their lowercase casing for back-compatibility; new values match LDP UPPERCASE
-- canon. Future cleanup may unify casing.
--
-- LDP §6 Engagement-Document: offer_letter_status (currently 7 values) gains
-- COUNTERSIGNED (split from accepted), ACTIVE (in-force), SUPERSEDED, VOIDED.

ALTER TYPE "public"."equipment_status" ADD VALUE IF NOT EXISTS 'ACQUIRED' BEFORE 'available';
ALTER TYPE "public"."equipment_status" ADD VALUE IF NOT EXISTS 'IN_TRANSIT' AFTER 'reserved';
ALTER TYPE "public"."equipment_status" ADD VALUE IF NOT EXISTS 'RETURNED' AFTER 'in_use';
ALTER TYPE "public"."equipment_status" ADD VALUE IF NOT EXISTS 'LOST';

ALTER TYPE "public"."offer_letter_status" ADD VALUE IF NOT EXISTS 'COUNTERSIGNED' AFTER 'accepted';
ALTER TYPE "public"."offer_letter_status" ADD VALUE IF NOT EXISTS 'ACTIVE' AFTER 'COUNTERSIGNED';
ALTER TYPE "public"."offer_letter_status" ADD VALUE IF NOT EXISTS 'SUPERSEDED';
ALTER TYPE "public"."offer_letter_status" ADD VALUE IF NOT EXISTS 'VOIDED';
