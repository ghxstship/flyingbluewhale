-- notification_kind_catalog gains `timesheet`.
--
-- The PushKind taxonomy is mirrored in three places and only two of them are
-- machine-checked: `PushKind` (src/lib/push/send.ts) and `NOTIF_KINDS`
-- (src/components/notifications/kinds.ts) are held in lockstep by a
-- `satisfies` + an exhaustiveness assert, and this view is hand-synced with
-- no guard at all. So a kind can exist, gate correctly, and be invisible in
-- the /m/settings/notifications matrix — a switch the user never sees for
-- notifications they do receive.
--
-- src/lib/push/notification-kind-mirror.test.ts now closes that: it parses the
-- VALUES list out of this migration and asserts it equals NOTIF_KINDS.

CREATE OR REPLACE VIEW "public"."notification_kind_catalog" WITH ("security_invoker"='true') AS
 SELECT kind, label, description
   FROM ( VALUES
     ('announcement'::text,'Updates'::text,'Org-wide announcements'::text),
     ('chat'::text,'Chat'::text,'Direct messages and channels'::text),
     ('kudos'::text,'Kudos'::text,'Recognition posts'::text),
     ('badge'::text,'Badges'::text,'Awards from your org'::text),
     ('assignment'::text,'Assignments'::text,'New tickets, credentials, and advancing items assigned to you'::text),
     ('assignment_state'::text,'Assignment state'::text,'State changes on assignments you own'::text),
     ('assignment_scan'::text,'Scans'::text,'Your ticket or credential was scanned'::text),
     ('shift_swap'::text,'Shift Swap'::text,'Swap request decisions'::text),
     ('time_off'::text,'Time Off'::text,'Time-off request decisions'::text),
     ('timesheet'::text,'Timesheets'::text,'Timesheet submissions and decisions'::text),
     ('course'::text,'Courses'::text,'Course assignments + pass results'::text),
     ('incident'::text,'Incidents'::text,'Field incident updates (manager+ only)'::text)
   ) t(kind, label, description);

ALTER VIEW "public"."notification_kind_catalog" OWNER TO "postgres";
