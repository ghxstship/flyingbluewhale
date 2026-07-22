-- notification_kind_catalog gains `approval`.
--
-- The approval-decision and escalation pushes (/m/requests/actions.ts) were the
-- only remaining sendPush* callers with NO `kind`, which means they bypassed
-- the /m/settings/notifications opt-out matrix entirely — a worker could mute
-- every category and still be pinged about approvals, with no switch to find.
-- Same placebo-failure class the kinds module exists to prevent. The TS mirrors
-- (PushKind in src/lib/push/send.ts, NOTIF_KINDS in
-- src/components/notifications/kinds.ts) gain the value in the same commit;
-- notification-kind-mirror.test.ts holds the three in lockstep.

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
  ('approval'::text, 'Approvals'::text, 'Decisions and escalations on approval requests'::text),
  ('timesheet'::text, 'Timesheets'::text, 'Timesheet submissions and decisions'::text),
  ('payroll'::text, 'Payroll'::text, 'A payroll run covering your time was posted'::text),
  ('time_correction'::text, 'Time Corrections'::text, 'Decisions on time corrections you requested'::text)
) t(kind, label, description);
