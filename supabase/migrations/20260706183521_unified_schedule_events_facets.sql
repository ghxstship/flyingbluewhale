-- CP·3 (Unified Schedule) — generalise the canonical schedule store `events`
-- into the polymorphic, resource-bound activity store the unified operational
-- timeline (/studio/operations/schedule) reads.
--
-- Repo reality vs the handoff: the handoff named `schedule_activities`, but that
-- is the CPM/WBS baseline store (baseline_id/code/duration_days all NOT NULL) and
-- backfilling shifts/reservations into it would DUPLICATE those nouns — violating
-- the 3NF law the handoff invokes. `events` is the actual schedule store (behind
-- /studio/schedule, "One Schedule Store"), already carrying event_kind + starts_at
-- + ends_at + location_id + event_state + created_by. Facets land here.
--
-- Additive only. No backfill / no duplication: shifts, dispatch_runs and
-- reservations stay in their own stores and are unioned into the timeline as read
-- projections; only net-new typed activities (rehearsal/changeover/…) live here.

begin;

-- 1. Extend the typed-activity taxonomy with the two kinds the schedule store
--    lacked (soundcheck already exists as `sound_check`; reservation/maintenance/
--    dispatch are projections of their own stores, not event rows).
alter type public.schedule_event_kind add value if not exists 'rehearsal';
alter type public.schedule_event_kind add value if not exists 'changeover';

-- 2. Polymorphic location vocabulary — a lane can be a venue, a fleet vessel, a
--    hotel room block, a warehouse, an office, a greenroom/star-trailer, or a
--    vehicle. `location_id` already exists on events; this names its kind so the
--    surface can group any activity by any lane kind without hardcoded keys.
do $$ begin
  create type public.location_kind as enum (
    'venue','vessel','hotel_block','warehouse','office','greenroom','vehicle'
  );
exception when duplicate_object then null; end $$;

-- 3. Facet columns on the canonical store (no new table).
alter table public.events
  add column if not exists location_kind public.location_kind,
  add column if not exists resource_ref  uuid;   -- crew member | asset | space; kind-dispatched, no FK

comment on column public.events.location_kind is
  'Unified-schedule lane kind for this activity (polymorphic; pairs with location_id).';
comment on column public.events.resource_ref is
  'Unified-schedule resource binding (crew member / asset / space); kind-dispatched, no FK.';

-- 4. Timeline read indexes: lane grouping and resource grouping over the day window.
create index if not exists events_schedule_lane_idx
  on public.events (org_id, location_kind, location_id, starts_at);
create index if not exists events_schedule_resource_idx
  on public.events (org_id, resource_ref, starts_at);

commit;
