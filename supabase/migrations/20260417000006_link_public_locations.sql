-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 059: Link Public Locations to ATLVS Venues
-- Adds the 3NF canonical mapping from project locations
-- back to the global ATLVS venue catalog.
-- ═══════════════════════════════════════════════════════

alter table public.locations
  add column if not exists atlvs_venue_id uuid references atlvs.venues(id) on delete set null;

create index if not exists idx_locations_atlvs_venue on public.locations(atlvs_venue_id);
