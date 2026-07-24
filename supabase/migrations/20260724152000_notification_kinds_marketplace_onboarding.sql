-- notification_kind_catalog gains `marketplace` + `onboarding`.
--
-- `marketplace`: applicant/submitter state-change notifications, talent-offer
-- notifications, saved-search alerts, and bulk casting invites all need a
-- toggleable kind — until now talent offers were inbox-only ("no marketplace
-- PushKind exists in the catalog yet", marketplace/offers/new/actions.ts) and
-- application/submission decisions notified nobody at all.
--
-- `onboarding`: the roster onboarding doc reminder (/m/roster/.../onboarding/
-- actions.ts) shipped with NO kind, which bypasses the /m/settings/
-- notifications opt-out matrix entirely — the same placebo-failure class the
-- `approval` kind closed. Its own comment flagged it "for convergence when an
-- onboarding kind lands in the catalog"; this is that landing.
--
-- The TS mirrors (PushKind in src/lib/push/send.ts, NOTIF_KINDS in
-- src/components/notifications/kinds.ts) gain both values in the same commit;
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
  ('certification'::text, 'Certifications'::text, 'Recertification request decisions'::text),
  ('incident'::text, 'Incidents'::text, 'Field incident updates (manager+ only)'::text),
  ('approval'::text, 'Approvals'::text, 'Decisions and escalations on approval requests'::text),
  ('timesheet'::text, 'Timesheets'::text, 'Timesheet submissions and decisions'::text),
  ('payroll'::text, 'Payroll'::text, 'A payroll run covering your time was posted'::text),
  ('time_correction'::text, 'Time Corrections'::text, 'Decisions on time corrections you requested'::text),
  ('marketplace'::text, 'Marketplace'::text, 'Applications, submissions, offers, and saved-search matches'::text),
  ('onboarding'::text, 'Onboarding'::text, 'Onboarding doc reminders and step updates'::text)
) t(kind, label, description);
