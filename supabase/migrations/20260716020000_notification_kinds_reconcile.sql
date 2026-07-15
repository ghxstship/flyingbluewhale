-- Reconcile the notification kind catalog across two parallel sessions.
--
-- Two sessions added a `timesheet` PushKind within minutes of each other and
-- git auto-merged both additions without a conflict, so the union, the email
-- label map, NOTIF_KINDS and the fallbacks each carried it TWICE. Only the
-- object literal was a type error (TS1117); the tuple and the fallback array
-- are type-legal duplicates that would have rendered two "Timesheets" rows in
-- the matrix. Deduped in the same commit as this migration.
--
-- This supersedes 20260716010000 for two reasons:
--   1. FORMAT. notification-kind-mirror.test.ts parses the kind literals out of
--      the latest migration defining this view and requires the `::text` cast
--      form (its "guard the guard" assertion caught 20260716010000's bare
--      literals: it parsed 0 kinds, which would have made every other
--      assertion in that file vacuously pass).
--   2. COPY. `timesheet` now covers BOTH directions — the worker's own sheet
--      events via notify()/NOTIFY_EVENT_PUSH_KIND, and the manager-band
--      submission alert via /m/timesheets/notify.ts. The worker-only wording
--      that shipped in 20260716010000 is wrong for the manager half.
--
-- Additive and idempotent: same 14 kinds, no preference is disturbed (a missing
-- `matrix[kind]` cell already means "not muted").
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
  ('shift_swap'::text, 'Shift Swap'::text, 'Swap request decisions'::text),
  ('time_off'::text, 'Time Off'::text, 'Time-off request decisions'::text),
  ('course'::text, 'Courses'::text, 'Course assignments + pass results'::text),
  ('incident'::text, 'Incidents'::text, 'Field incident updates (manager+ only)'::text),
  ('timesheet'::text, 'Timesheets'::text, 'Timesheet submissions and decisions'::text),
  ('payroll'::text, 'Payroll'::text, 'A payroll run covering your time was posted'::text),
  ('time_correction'::text, 'Time Corrections'::text, 'Decisions on time corrections you requested'::text)
) t(kind, label, description);
