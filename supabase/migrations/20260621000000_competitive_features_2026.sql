-- competitive_features_2026.sql
-- Implements five competitively-informed features derived from analysis of
-- Connecteam, Deputy, Bizzabo/Cvent, Eventbrite, and Coupa/SAP Ariba
-- 2025-2026 product updates.

-- ─────────────────────────────────────────────────────────────────────────────
-- Feature 1 — Shift Pulse (Deputy / Connecteam pattern)
-- End-of-shift morale signal captured at clock-out on the COMPVSS mobile PWA.
-- Admins see aggregate mood trends per project/venue in the workforce hub.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS pulse_rating smallint
    CONSTRAINT time_entries_pulse_rating_range CHECK (pulse_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS pulse_note text;

COMMENT ON COLUMN public.time_entries.pulse_rating IS
  'Optional 1–5 end-of-shift morale signal captured at clock-out (1=rough, 5=great). NULL = skipped.';
COMMENT ON COLUMN public.time_entries.pulse_note IS
  'Optional free-text note accompanying the pulse_rating.';

-- ─────────────────────────────────────────────────────────────────────────────
-- Feature 2 — Top Organizer badge (Eventbrite pattern)
-- Platform-level trust signal surfaced on public marketplace profiles.
-- Set by ATLVS platform ops (or org admin self-service in the console).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.orgs
  ADD COLUMN IF NOT EXISTS is_top_organizer boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.orgs.is_top_organizer IS
  'Eventbrite-style trust badge — org consistently delivers high-quality events. Surfaced on public talent/vendor marketplace profiles.';

-- Rebuild public_talent_directory to expose the organizer trust signal.
-- Keeps security_invoker=off (definer mode) matching the original definition.
CREATE OR REPLACE VIEW public.public_talent_directory
  WITH (security_invoker = off) AS
SELECT
  tp.id,
  tp.public_handle,
  tp.act_name,
  tp.tagline,
  tp.bio,
  tp.genre_tags,
  tp.photo_url,
  tp.hero_url,
  tp.video_reel_url,
  tp.fee_min_cents,
  tp.fee_max_cents,
  tp.currency,
  tp.travel_radius_km,
  tp.monthly_listeners,
  tp.follower_count,
  tp.rating_avg,
  tp.rating_count,
  (tp.verified_at IS NOT NULL) AS is_verified,
  tp.created_at,
  COALESCE(o.is_top_organizer, false) AS is_top_organizer
FROM public.talent_profiles tp
LEFT JOIN public.orgs o ON o.id = tp.org_id
WHERE tp.is_public = true AND tp.deleted_at IS NULL;

COMMENT ON VIEW public.public_talent_directory IS
  'Public talent EPK feed — definer mode, see public_rfq_marketplace. v2: adds is_top_organizer from orgs.';

-- Rebuild public_vendor_directory to expose the organizer trust signal.
CREATE OR REPLACE VIEW public.public_vendor_directory
  WITH (security_invoker = off) AS
SELECT
  v.id,
  v.public_handle,
  v.name,
  v.tagline,
  v.bio,
  v.logo_url,
  v.hero_url,
  v.website_url,
  v.regions,
  v.trade_categories,
  v.rating_avg,
  v.rating_count,
  (v.verified_at IS NOT NULL) AS is_verified,
  v.year_founded,
  v.created_at,
  COALESCE(o.is_top_organizer, false) AS is_top_organizer
FROM public.vendors v
LEFT JOIN public.orgs o ON o.id = v.org_id
WHERE v.is_public_profile = true AND v.deleted_at IS NULL;

COMMENT ON VIEW public.public_vendor_directory IS
  'Public vendor profile feed — definer mode, see public_rfq_marketplace. v2: adds is_top_organizer from orgs.';
