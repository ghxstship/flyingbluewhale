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
