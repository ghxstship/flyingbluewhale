-- ============================================================================
-- Missing FK indexes on guide_access_codes (3NF / SOOT compliance pass).
-- ============================================================================
-- Migration 20260511000001 created guide_access_codes with two FK columns that
-- had no dedicated B-tree index:
--
--   org_id     uuid references orgs(id) on delete cascade
--   created_by uuid references users(id) on delete set null
--
-- Without indexes on these columns Postgres must perform a sequential scan of
-- the entire table during:
--   1. ON DELETE CASCADE from orgs — scanning guide_access_codes for all rows
--      belonging to a deleted org.
--   2. ON DELETE SET NULL from users — scanning for all rows created_by a
--      deleted user.
--
-- The project_id FK is already covered by the composite index
-- guide_access_codes_project_persona_active, but org_id and created_by
-- are unindexed hot paths for the above lifecycle operations.
-- ============================================================================

create index if not exists guide_access_codes_org_id
  on guide_access_codes (org_id);

create index if not exists guide_access_codes_created_by
  on guide_access_codes (created_by)
  where created_by is not null;
