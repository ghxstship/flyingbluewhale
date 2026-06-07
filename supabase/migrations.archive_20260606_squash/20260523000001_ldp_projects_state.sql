-- 0060_ldp_projects_state.sql
--
-- LDP rename: projects.status → projects.project_state.
--
-- Per `LIFECYCLE_DECOMPOSITION_PROTOCOL.md` §NAMING DISCIPLINE, `status` is
-- banned in new tables and every existing `status` column is a defect
-- candidate at schema review. The `projects` table carries both `status`
-- (legacy: draft/active/paused/archived/complete — the *operational state*
-- of a project record) and `xpms_phase` (canonical: the 8-phase sequential
-- macro arc). The two represent different axes:
--
--   - `xpms_phase` = where in the production lifecycle the show is
--     (discovery → wrap). Sequential, monotonically non-decreasing in
--     happy path.
--   - `project_state` = the operational state of the workspace record
--     itself (draft until provisioned, active while running, paused
--     during a freeze, archived after wrap, complete on closeout).
--     Cyclical / non-sequential.
--
-- Therefore: rename the column to `project_state` and rename the enum to
-- match — `status` → `state` everywhere. Both axes are now canonically
-- named per §NAMING DISCIPLINE.
--
-- Not applied yet — see ticket. Application order:
--   1. ALTER TYPE project_status RENAME TO project_state;
--   2. ALTER TABLE projects RENAME COLUMN status TO project_state;
--   3. Same-PR code rename across src/ (18+ readers/writers) so the app
--      stays online through the deploy.

BEGIN;

ALTER TYPE public.project_status RENAME TO project_state;
ALTER TABLE public.projects RENAME COLUMN status TO project_state;

-- Note: there is no functional dependency between this column and any
-- check constraint, trigger, or RLS policy that names `status` literally,
-- so the rename is a pure metadata change. A query against the column
-- under its old name (`projects.status`) will fail with 42703 immediately
-- after this migration applies — every reader/writer in src/ must flip in
-- the same deploy.

COMMIT;
