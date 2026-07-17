-- Time & pay notification kinds.
--
-- notification_kind_catalog is the third leg of the PushKind mirror (the other
-- two are the `PushKind` union in src/lib/push/send.ts and `NOTIF_KINDS` in
-- src/components/notifications/kinds.ts). The /me/notifications and
-- /m/settings/notifications matrices render from this view, so a kind absent
-- here has no switch — and `notify()` now pushes the timesheet / payroll /
-- correction events, which must be mutable.
--
-- Additive: the 11 existing kinds are unchanged. `notification_preferences.matrix`
-- is JSONB with no per-kind cell required, and a missing cell means "not muted"
-- (filterByPushPrefs excludes only on `push === false`), so no backfill is needed
-- and no existing preference is disturbed.
create or replace view public.notification_kind_catalog as
select kind, label, description
from (
  values
    ('announcement', 'Updates', 'Org-wide announcements'),
    ('chat', 'Chat', 'Direct messages and channels'),
    ('kudos', 'Kudos', 'Recognition posts'),
    ('badge', 'Badges', 'Awards from your org'),
    ('assignment', 'Assignments', 'New tickets, credentials, and advancing items assigned to you'),
    ('assignment_state', 'Assignment state', 'State changes on assignments you own'),
    ('assignment_scan', 'Scans', 'Your ticket or credential was scanned'),
    ('shift_swap', 'Shift Swap', 'Swap request decisions'),
    ('time_off', 'Time Off', 'Time-off request decisions'),
    ('course', 'Courses', 'Course assignments + pass results'),
    ('incident', 'Incidents', 'Field incident updates (manager+ only)'),
    ('timesheet', 'Timesheets', 'Your timesheet was submitted, approved, rejected, or posted'),
    ('payroll', 'Payroll', 'A payroll run covering your time was posted'),
    ('time_correction', 'Time Corrections', 'Decisions on time corrections you requested')
) t(kind, label, description);
