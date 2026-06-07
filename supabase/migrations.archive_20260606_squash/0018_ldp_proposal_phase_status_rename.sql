-- SUPERSEDED 2026-05-09 by 20260509060000_ldp_lifecycle_remediations_reconciled.sql.
-- Pre-flight against the live remote schema (xrovijzjbyssajhtwvas) showed
-- USNP canon (shipped 2026-05-08) already implements most of LDP §3/§5/§7:
--   - LDP §5 Engagement → uis_roles.lifecycle_state uis_lifecycle_state
--   - LDP §3 Asset → asset_movements (ual_state-typed)
--   - LDP §7 Financial Period → accounting_periods
-- The reconciled migration ships only the genuinely net-new bits and
-- skips work USNP canon already covers. THIS FILE IS NOT APPLIED.
-- Kept in repo as an audit artifact of the original LDP-naive proposal.

-- LDP Phase 5 remediation, batch 5: cosmetic enum rename per LDP naming discipline.
--
-- The existing enum proposal_phase_status carries phase semantics
-- (locked/active/in_review/approved/complete) but its name fuses "phase"
-- and "status" — two LDP-locked vocabulary words that must mean different
-- things. Rename to proposal_phase_state to align with LDP discipline.
--
-- Postgres ALTER TYPE ... RENAME TO updates the type catalog and all
-- references (column types, function signatures, etc.) atomically.
-- No application-side change required if consumers reference the type
-- name only via column metadata; explicit typed code (TS types via
-- generate_typescript_types) requires a regen post-migration.

ALTER TYPE "public"."proposal_phase_status" RENAME TO "proposal_phase_state";
