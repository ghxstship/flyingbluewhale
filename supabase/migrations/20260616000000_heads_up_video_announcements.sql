-- migration: 20260616000000_heads_up_video_announcements
-- Feature: "Heads Up" video/image announcements (SafetyCulture competitor parity)
--
-- Adds optional short-form media to announcements. A Heads Up is a 30-60s
-- video (or image) clip that auto-plays Story-style in the COMPVSS feed —
-- higher visual impact than a text-only update, lower effort than a course.
--
-- media_kind is enforced by CHECK at the DB layer so application code that
-- skips validation still can't write an unsupported type.

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS media_url  text,
  ADD COLUMN IF NOT EXISTS media_kind text
    CHECK (media_kind IN ('video', 'image'));

-- The COMPVSS feed prioritises media announcements in its hero slot.
-- This partial index supports the "published + has media" list efficiently.
CREATE INDEX IF NOT EXISTS idx_announcements_media_published
  ON public.announcements (org_id, published_at DESC)
  WHERE media_url IS NOT NULL AND deleted_at IS NULL;

COMMENT ON COLUMN public.announcements.media_url  IS 'Supabase Storage URL for the Heads Up media clip (video ≤60s or image). NULL = text-only announcement.';
COMMENT ON COLUMN public.announcements.media_kind IS 'Discriminates the media_url type: ''video'' (mp4/webm) or ''image'' (jpg/png/webp). Required when media_url is set.';
