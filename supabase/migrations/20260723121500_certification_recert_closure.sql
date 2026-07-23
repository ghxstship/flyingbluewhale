-- L-P6b · CERTIFICATION LIFECYCLE CLOSURE (LEG3ND readiness blockers B-3 + B-5).
--
-- Recon result: the heavy lifting already exists in the live schema —
-- `certification_recerts.recert_state` (requested/in_review/approved/rejected/
-- completed, LDP-conformant) plus `decided_at`/`decided_by` shipped in
-- 20260623215833_legend_certifications, and the 20260625144337 manager-grant
-- sweep already extended the write policies on `legend_certifications`,
-- `certification_holders`, and `certification_recerts` to the full manager
-- band (owner/admin/manager/controller). No new RLS arms are needed.
--
-- What was actually missing is app-layer (the queue/decide surfaces and the
-- definitions CRUD, shipped alongside this migration) plus two small schema
-- gaps this migration closes:
--
-- 1. `certification_recerts.decision_note` — the reviewer's reason. The
--    workforce time-off precedent (decision_note on time_off_requests) exists
--    so a denial arrives with the reason, not a bare verdict; recerts get the
--    same column. App code reads it optionally (select *), so the read path
--    tolerates this column being absent — but the decide action writes it
--    when a note is supplied, so APPLY BEFORE DEPLOY.
--
-- 2. `notification_kind_catalog` gains `certification`. The recert decision
--    push (legend certifications) is a new sendPushTo caller and no existing
--    kind fits: `course` is "Course assignments + pass results" and a
--    credential decision is neither. Without a catalog row the kind would
--    bypass the /m/settings/notifications opt-out matrix — the placebo
--    failure the kinds module exists to prevent. The TS mirrors (PushKind in
--    src/lib/push/send.ts, NOTIF_KINDS + fallbacks in
--    src/components/notifications/kinds.ts) gain the value in the same
--    change; notification-kind-mirror.test.ts holds the three in lockstep.
--
-- CODE-READY migration — authored, NOT applied.

alter table public.certification_recerts
  add column if not exists decision_note text;

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
  ('time_correction'::text, 'Time Corrections'::text, 'Decisions on time corrections you requested'::text)
) t(kind, label, description);
