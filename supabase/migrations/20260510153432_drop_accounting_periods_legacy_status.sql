-- ============================================================================
-- LDP §NAMING DISCIPLINE — drop legacy `status text` from accounting_periods.
--
-- Background: migration 0019_usnp_canon_local_parity.sql added accounting_periods
-- with a nullable `status text` column kept purely as a back-compat scaffold so
-- migration 0020_ldp_lifecycle_remediations_reconciled.sql could backfill the
-- canonical `state accounting_period_state` column from it.  Once 0020 ran, the
-- `status` column became dead code.
--
-- This migration was applied to the remote project on 2026-05-10 but the local
-- file was not committed at the time; adding it here closes the gap for any
-- developer who runs `supabase db reset` from scratch.
--
-- All application code references `accounting_periods.state`; the generated
-- database.types.ts (regenerated after this ran on remote) no longer includes
-- the `status` column.
-- ============================================================================

ALTER TABLE "public"."accounting_periods"
    DROP COLUMN IF EXISTS "status";
