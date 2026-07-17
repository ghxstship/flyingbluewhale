-- Time capture fidelity — the columns geofence enforcement needs to exist.
--
-- Phase 1 of docs/compvss/TIME_MANAGEMENT_LIFECYCLE_PLAN.md. Three gaps in
-- what a punch records today, each of which blocks a capability above it:
--
--   1. No accuracy. `useClockPunch` requests enableHighAccuracy and throws
--      `coords.accuracy` away. Without it a 500 m-accurate fix that lands
--      outside a 100 m zone is indistinguishable from a 5 m fix that does,
--      so a block policy would punish bad signal rather than absence. The
--      accuracy gate (reclassify 'outside' -> 'unknown' above a threshold)
--      is unbuildable until this is captured.
--   2. No departure fix. `useClockPunch` only reads GPS on clock_in
--      (`action === "clock_in" ? await getPosition() : null`), so there is
--      no geofence data on clock_out at all — neither exit enforcement nor
--      "leaving site -> clock out?" detection has anything to read.
--   3. No exception ledger. A punch is clean or it doesn't exist; there is
--      nowhere to record "accepted, but needs a manager's eye".
--
-- LDP: `enforcement_state` is the CYCLICAL operational lifecycle of a
-- punch's exception (clean -> quarantined -> overridden), so `_state`.
-- `source_channel` is a facet, not a lifecycle.
--
-- Additive + defaulted: every existing row reads 'clean'/'app' and no
-- surface changes behaviour. The policy that acts on these lands in
-- 20260715150100_geofence_policy.sql, defaulting to record_only.

alter table public.time_entries
  -- Metres of uncertainty on the clock-in fix, straight from
  -- GeolocationCoordinates.accuracy. Null = the device didn't report one
  -- (or the punch predates this column), which reads as 'unknown', never
  -- as 'precise'.
  add column if not exists punch_accuracy_m double precision
    check (punch_accuracy_m is null or punch_accuracy_m >= 0),

  -- The clock-out fix. Mirrors the clock-in trio rather than overwriting
  -- it: a shift's start and end are different places and both matter.
  add column if not exists punch_out_lat double precision
    check (punch_out_lat is null or (punch_out_lat >= -90 and punch_out_lat <= 90)),
  add column if not exists punch_out_lng double precision
    check (punch_out_lng is null or (punch_out_lng >= -180 and punch_out_lng <= 180)),
  add column if not exists punch_out_accuracy_m double precision
    check (punch_out_accuracy_m is null or punch_out_accuracy_m >= 0),
  add column if not exists geofence_out_state text
    check (geofence_out_state is null or geofence_out_state in ('inside', 'outside', 'unknown')),
  add column if not exists zone_out_id uuid references public.time_clock_zones(id),

  -- The exception ledger.
  --   clean       — nothing to review.
  --   warned      — outside/low-confidence under a warn policy, or inside
  --                 only by virtue of the grace radius. Informational.
  --   quarantined — accepted despite a block policy (worker override with
  --                 reason, GPS denied, or an offline replay that failed
  --                 server-side re-check). Needs a manager decision.
  --                 A block NEVER discards worked time — see the plan's
  --                 "geofence block must not destroy a record" rule.
  --   overridden  — a manager cleared it.
  add column if not exists enforcement_state text not null default 'clean'
    check (enforcement_state in ('clean', 'warned', 'quarantined', 'overridden')),
  add column if not exists enforcement_reason text,

  -- How the row got here. 'manager_entry' and 'correction' land in Phase 2;
  -- declaring the vocabulary now keeps the audit trail readable from the
  -- first quarantined punch.
  add column if not exists source_channel text not null default 'app'
    check (source_channel in ('app', 'offline_replay', 'manager_entry', 'correction', 'import'));

-- The manager review queue reads exactly this. Partial: the overwhelming
-- majority of punches are clean and should not be in the index.
create index if not exists time_entries_org_enforcement_state_idx
  on public.time_entries (org_id, enforcement_state)
  where enforcement_state <> 'clean';

-- zone_out_id is an FK and gets read per-entry on the review surface; the
-- repo's FK-index convention (migration 0050) applies.
create index if not exists time_entries_zone_out_id_idx
  on public.time_entries (zone_out_id)
  where zone_out_id is not null;

comment on column public.time_entries.punch_accuracy_m is
  'Metres of uncertainty on the clock-in fix (GeolocationCoordinates.accuracy). Null = not reported; treat as unknown confidence, never as precise. Drives the accuracy gate that reclassifies a low-confidence outside punch to unknown.';
comment on column public.time_entries.geofence_out_state is
  'Zone classification of the clock-out fix: inside | outside | unknown. Null on entries captured before departure fixes existed.';
comment on column public.time_entries.enforcement_state is
  'LDP cyclical lifecycle of a punch exception: clean | warned | quarantined | overridden. quarantined = accepted but requires manager review (override-with-reason, GPS denied, or a replay that failed server-side re-check). A geofence block never destroys a record of worked time; it routes it here.';
comment on column public.time_entries.source_channel is
  'How the row was created: app | offline_replay | manager_entry | correction | import. Distinguishes a worker punch from a manager-authored one in the audit trail.';
