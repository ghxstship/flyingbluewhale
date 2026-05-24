-- R26.1 — rename the 6 charthouse_* tables and 7 charthouse_* enum types
-- to siteplan_* per feedback_no_charthouse.md (Round 7 — Charthouse term
-- banned). UI text was purged in Round 7; this finishes the job at the
-- schema layer.
--
-- ALTER TABLE RENAME auto-renames primary keys + indexes that follow the
-- default naming pattern; explicit constraints keep their original name
-- and are renamed separately below.

BEGIN;

-- ── Tables ───────────────────────────────────────────────────────────────
ALTER TABLE public.charthouse_adjacency   RENAME TO siteplan_adjacency;
ALTER TABLE public.charthouse_band        RENAME TO siteplan_band;
ALTER TABLE public.charthouse_placement   RENAME TO siteplan_placement;
ALTER TABLE public.charthouse_station     RENAME TO siteplan_station;
ALTER TABLE public.charthouse_utility     RENAME TO siteplan_utility;
ALTER TABLE public.charthouse_zone_region RENAME TO siteplan_zone_region;

-- ── Enum types ──────────────────────────────────────────────────────────
ALTER TYPE public.charthouse_adjacency_rel   RENAME TO siteplan_adjacency_rel;
ALTER TYPE public.charthouse_band_type       RENAME TO siteplan_band_type;
ALTER TYPE public.charthouse_document_state  RENAME TO siteplan_document_state;
ALTER TYPE public.charthouse_edge            RENAME TO siteplan_edge;
ALTER TYPE public.charthouse_sheet_type      RENAME TO siteplan_sheet_type;
ALTER TYPE public.charthouse_shell_type      RENAME TO siteplan_shell_type;
ALTER TYPE public.charthouse_utility_service RENAME TO siteplan_utility_service;

-- ── Replace stale COMMENTS we wrote in 20260524000000 ───────────────────
COMMENT ON TABLE public.siteplan_adjacency   IS 'Adjacency edges between site-plan zones. Renamed from charthouse_adjacency (banned term).';
COMMENT ON TABLE public.siteplan_band        IS 'Site-plan bands (latitudinal bars). Renamed from charthouse_band.';
COMMENT ON TABLE public.siteplan_placement   IS 'Tagged placements (assets, scenic, fixtures) on a site plan. Renamed from charthouse_placement.';
COMMENT ON TABLE public.siteplan_station     IS 'Stations / activity nodes on a site plan. Renamed from charthouse_station.';
COMMENT ON TABLE public.siteplan_utility     IS 'Utility drops (power, water, signal, etc.) on a site plan. Renamed from charthouse_utility.';
COMMENT ON TABLE public.siteplan_zone_region IS 'Zone regions on a site plan. Renamed from charthouse_zone_region.';

COMMIT;
