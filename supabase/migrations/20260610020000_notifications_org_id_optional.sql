-- notifications.org_id — make the column match its documented contract.
--
-- ADR-0010 already calls org_id "optional org scope", but the column was
-- created NOT NULL. The push pipeline's recordNotifications() sends
-- org_id NULL whenever the caller doesn't pass one (most sendPushTo /
-- sendPushBulk call sites), so every such bell write failed the NOT NULL
-- constraint and was silently swallowed into the
-- push.record_notifications_error log — the bell row never landed.
--
-- Dropping NOT NULL makes org-less rows legal: they surface in the apex
-- bell (/api/v1/notifications, /me/notifications/inbox — user_id-only
-- filters) and simply don't appear in the org-filtered /m and /p bells.
-- The notifications_insert RLS policy (is_org_member(org_id)) evaluates
-- NULL → row rejected for user-session clients, so org-less rows remain
-- a service-role-only write path.

ALTER TABLE "public"."notifications" ALTER COLUMN "org_id" DROP NOT NULL;

COMMENT ON COLUMN "public"."notifications"."org_id" IS 'ADR-0010: optional org scope (nullable since 20260609230000). The ATLVS bell filters here so multi-org users only see the active org''s notifications; NULL rows surface only in user-scoped bells.';
