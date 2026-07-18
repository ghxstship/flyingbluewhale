-- Kit 32 v2.9 · Shift Scheduler field surface (/m/scheduler).
--
-- 1. `publish_state` — the shift publish facet (LDP *_state; cyclical
--    operational state draft → published). The kit's field scheduler builds
--    DRAFT shifts and publishes them per shift / per day; nothing in the
--    schema carried that distinction (rosters.state is the console-level
--    day-container facet, not per-shift). Existing rows and every existing
--    writer (console rostering, volunteer flows) are grandfathered as
--    'published' via the column default, so no current surface changes
--    behavior; only the field scheduler inserts 'draft' explicitly.
-- 2. `hourly_rate_cents` + `notes` — FORMS.shift carries Rate ($/hr) and
--    Notes (call details, PPE, meet point). Cents integer per repo money
--    convention; both nullable.
-- 3. DELETE policy parity — 20260625144337 granted the manager band
--    INSERT/UPDATE on shifts but the baseline DELETE policy was never
--    reswept, so a manager's remove was a silent RLS no-op (0 rows, no
--    error). The field scheduler's swipe-Remove is a manager action; align
--    DELETE with the INSERT/UPDATE band.
-- 4. `notification_kind_catalog` gains `shift` — "your shift was published"
--    is not a swap decision (`shift_swap`); the kit's notification matrix
--    carries a Shifts category. Same 14 kinds + shift, ::text literal form
--    (notification-kind-mirror.test.ts parses these).

CREATE TYPE public.shift_publish_state AS ENUM ('draft', 'published');

ALTER TABLE public.shifts
  ADD COLUMN publish_state public.shift_publish_state NOT NULL DEFAULT 'published',
  ADD COLUMN hourly_rate_cents integer,
  ADD COLUMN notes text;

COMMENT ON COLUMN public.shifts.publish_state IS
  'Kit 32 field scheduler facet: draft shifts are visible to the scheduling band only; publishing notifies assigned crew. Default published grandfathers console/volunteer writers.';

DROP POLICY IF EXISTS shifts_admin__delete ON public.shifts;
CREATE POLICY shifts_admin__delete ON public.shifts
  FOR DELETE TO authenticated
  USING (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

create or replace view public.notification_kind_catalog as
select kind, label, description
from ( values
  ('announcement'::text, 'Updates'::text, 'Org-wide announcements'::text),
  ('chat'::text, 'Chat'::text, 'Direct messages and channels'::text),
  ('kudos'::text, 'Kudos'::text, 'Recognition posts'::text),
  ('badge'::text, 'Badges'::text, 'Awards from your org'::text),
  ('assignment'::text, 'Assignments'::text, 'New tickets, credentials, and advancing items assigned to you'::text),
  ('assignment_state'::text, 'Assignment state'::text, 'State changes on assignments you own'::text),
  ('assignment_scan'::text, 'Scans'::text, 'Your ticket or credential was scanned'::text),
  ('shift'::text, 'Shifts'::text, 'A shift you are rostered on was published or updated'::text),
  ('shift_swap'::text, 'Shift Swap'::text, 'Swap request decisions'::text),
  ('time_off'::text, 'Time Off'::text, 'Time-off request decisions'::text),
  ('course'::text, 'Courses'::text, 'Course assignments + pass results'::text),
  ('incident'::text, 'Incidents'::text, 'Field incident updates (manager+ only)'::text),
  ('timesheet'::text, 'Timesheets'::text, 'Timesheet submissions and decisions'::text),
  ('payroll'::text, 'Payroll'::text, 'A payroll run covering your time was posted'::text),
  ('time_correction'::text, 'Time Corrections'::text, 'Decisions on time corrections you requested'::text)
) t(kind, label, description);
