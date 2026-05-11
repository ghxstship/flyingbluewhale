-- Connecteam parity wiring — schema extensions that connect the new
-- tables added in 0046 to the existing field-ops surface.
--
-- Scope:
--   1. time_entries.shift_id  — links the punch-event time_entry row
--      back to the schedule shift, so geofence info on time_entries
--      can be retrieved per-shift in the operator timesheet view.
--   2. personal_documents storage bucket bootstrap. The bucket itself
--      is created in storage.buckets so uploads work the moment the
--      first user lands on /m/docs/new.
--   3. shift_swaps coverage view — convenience view for the admin
--      surface that needs requester/target user emails inline.

-- ============================================================
-- 1. time_entries.shift_id
-- ============================================================

ALTER TABLE "public"."time_entries"
    ADD COLUMN IF NOT EXISTS "shift_id" uuid REFERENCES "public"."shifts"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_time_entries_shift_id ON "public"."time_entries"(shift_id) WHERE shift_id IS NOT NULL;

-- ============================================================
-- 2. personal-documents storage bucket
-- Service-role-only bucket — uploads happen via server actions that
-- prefix the path with `{org_id}/{user_id}/...`. Signed URLs are
-- generated server-side for downloads. RLS on storage.objects is
-- governed by migration 0045 (apply via Dashboard SQL Editor); the
-- bucket itself is recreated here so a fresh DB has it.
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('personal-documents', 'personal-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. updated_at touch triggers for new tables that don't have them
-- (announcements, chat_rooms, surveys, courses, time_off_requests,
-- new_hire_flows). Mirrors the pattern used for other org-scoped
-- tables — keeps last-write timestamps honest for cache busts.
-- ============================================================

CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER announcements_touch_updated_at BEFORE UPDATE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER chat_rooms_touch_updated_at BEFORE UPDATE ON public.chat_rooms
    FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER surveys_touch_updated_at BEFORE UPDATE ON public.surveys
    FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER courses_touch_updated_at BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER time_off_requests_touch_updated_at BEFORE UPDATE ON public.time_off_requests
    FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER shift_swaps_touch_updated_at BEFORE UPDATE ON public.shift_swaps
    FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
