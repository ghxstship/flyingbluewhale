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
