-- T1-4 · Kiosk / shared-device punch mode (Rank 4,
-- docs/compvss/MOBILE_BEST_PRACTICES_2026-07.md).
--
-- A site tablet in kiosk mode lets crew self-serve punch in/out via a
-- personal PIN or their Rose-pass QR, without personal phones. The governing
-- discipline is the buddy-punch lesson (shift-punch ownership): capability is
-- NOT authorization — the kiosk device is a capability, and every punch must
-- resolve exactly ONE worker identity server-side before it lands.
--
-- Identity model (why PINs key on auth users, not crew_members):
--   * The whole punch pipeline (`/api/v1/time/clock`, compile_timesheets,
--     /m/timesheets) keys `time_entries.user_id` on auth users. A PIN that
--     resolved a `crew_members` row with `user_id IS NULL` would punch into a
--     void — no timesheet could ever gather those entries.
--   * The pass-QR path reuses `assignment_scan_codes` (the Rose pass renders
--     the holder's real active code) and resolves through the assignment's
--     party to the same auth user. Two credentials, one identity space.
--
-- Security model:
--   * `kiosk_devices.device_token_hash` — SHA-256 of a long-lived random
--     device token minted at registration by a manager's own session. The raw
--     token lives only in the tablet's httpOnly cookie; the DB stores the
--     hash. Kiosk sessions NEVER carry a user session.
--   * `kiosk_worker_pins.pin_hash` — scrypt (app-side, node:crypto). The
--     sibling `pin_lookup_digest` is HMAC-SHA256(org:pin, KIOSK_PIN_SECRET)
--     so a PIN entry is an O(1) indexed lookup instead of an org-wide scrypt
--     scan. A 4-6 digit PIN's real security is rate limiting + the server
--     pepper, not hash cost — the partial unique index below also gives
--     org-scoped PIN uniqueness (resolution must be unambiguous).
--   * Lockout state lives on the DEVICE (`failed_pin_attempts` /
--     `pin_locked_until`): a failed PIN matches no worker row, so the device
--     is the only unit a failure can be attributed to.
--
-- LDP: no lifecycle here — a device registration and a PIN are configuration,
-- not workflows. `active` is a plain visibility/revocation flag (mirrors
-- time_clock_zones / venue_geofences).

create table if not exists public.kiosk_devices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  -- Optional project binding: a show-site tablet scoped to one production.
  -- ON DELETE SET NULL — the device outlives the show, falls back to org-wide.
  project_id uuid references public.projects(id) on delete set null,
  -- Operator-facing name ("Load-In Gate iPad", "Crew Catering Tablet").
  label text not null,
  registered_by uuid references public.users(id) on delete set null,
  -- SHA-256 hex of the raw device token. The raw token is shown/stored only
  -- in the registering tablet's cookie; rotating = deactivate + re-register.
  device_token_hash text not null unique,
  active boolean not null default true,
  -- Device-scoped PIN brute-force ledger (see header). Reset on success.
  failed_pin_attempts integer not null default 0 check (failed_pin_attempts >= 0),
  pin_locked_until timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.kiosk_devices is
  'T1-4 kiosk mode: a registered shared punch tablet. The device token (hashed here) is the device''s only credential; every punch additionally resolves one worker via PIN or pass QR.';
comment on column public.kiosk_devices.device_token_hash is
  'SHA-256 hex of the raw device token minted at registration. Raw token lives only in the tablet''s httpOnly cookie.';
comment on column public.kiosk_devices.failed_pin_attempts is
  'Consecutive failed PIN entries on this device. A failed PIN identifies no worker, so lockout is device-scoped.';

create index if not exists idx_kiosk_devices_org_active on public.kiosk_devices (org_id) where active;
create index if not exists idx_kiosk_devices_project on public.kiosk_devices (project_id) where project_id is not null;
create index if not exists idx_kiosk_devices_registered_by on public.kiosk_devices (registered_by) where registered_by is not null;

create trigger kiosk_devices_touch_updated_at
  before update on public.kiosk_devices
  for each row execute function public.touch_updated_at();

alter table public.kiosk_devices enable row level security;

-- pg_default_acl grants anon SELECT on new tables — revoke explicitly.
revoke all on public.kiosk_devices from anon;
grant select, insert, update, delete on public.kiosk_devices to authenticated;

-- Manager band manages devices; plain members have no business reading the
-- token-hash register. The kiosk itself talks through the service role
-- (session-less), which bypasses RLS by construction.
create policy kiosk_devices_manage on public.kiosk_devices
  for all to authenticated
  using (private.has_org_role(org_id, array['owner','admin','manager','controller']))
  with check (private.has_org_role(org_id, array['owner','admin','manager','controller']));

-- ---------------------------------------------------------------------------

create table if not exists public.kiosk_worker_pins (
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  -- scrypt string (scrypt:N:r:p:saltB64:hashB64), authored app-side.
  pin_hash text not null,
  -- HMAC-SHA256(org_id || ':' || pin, KIOSK_PIN_SECRET) hex — the O(1)
  -- kiosk-entry lookup key. Rotating KIOSK_PIN_SECRET invalidates every
  -- digest (workers re-set PINs); pin_hash still verifies history.
  pin_lookup_digest text not null,
  active boolean not null default true,
  set_by uuid references public.users(id) on delete set null,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

comment on table public.kiosk_worker_pins is
  'T1-4 kiosk mode: per-worker punch PIN (scrypt hash + HMAC lookup digest). One row per (org, worker); the digest''s partial unique index enforces org-scoped PIN uniqueness so a PIN resolves exactly one identity.';
comment on column public.kiosk_worker_pins.pin_lookup_digest is
  'HMAC-SHA256(org:pin, server pepper), hex. Indexed lookup key for kiosk PIN entry; useless for offline brute force without the env secret.';

-- Resolution must be unambiguous: within an org, one active PIN → one worker.
-- Set-PIN paths surface a violation as "that PIN is unavailable".
create unique index if not exists uq_kiosk_worker_pins_org_digest
  on public.kiosk_worker_pins (org_id, pin_lookup_digest) where active;

create index if not exists idx_kiosk_worker_pins_user on public.kiosk_worker_pins (user_id);
create index if not exists idx_kiosk_worker_pins_set_by on public.kiosk_worker_pins (set_by) where set_by is not null;

create trigger kiosk_worker_pins_touch_updated_at
  before update on public.kiosk_worker_pins
  for each row execute function public.touch_updated_at();

alter table public.kiosk_worker_pins enable row level security;

revoke all on public.kiosk_worker_pins from anon;
grant select, insert, update, delete on public.kiosk_worker_pins to authenticated;

-- A worker manages their OWN pin row (self-serve set/replace at /m/kiosk/pin).
-- `(select auth.uid())` — initplan form, per the DB advisor remediation canon.
create policy kiosk_worker_pins_own on public.kiosk_worker_pins
  for all to authenticated
  using (user_id = (select auth.uid()) and private.is_org_member(org_id))
  with check (user_id = (select auth.uid()) and private.is_org_member(org_id));

-- Manager band can deactivate / reissue any worker's PIN row in the org.
create policy kiosk_worker_pins_manage on public.kiosk_worker_pins
  for all to authenticated
  using (private.has_org_role(org_id, array['owner','admin','manager','controller']))
  with check (private.has_org_role(org_id, array['owner','admin','manager','controller']));

-- ---------------------------------------------------------------------------
-- time_entries provenance: a kiosk punch is a first-class capture channel
-- (source_channel facet, NOT a lifecycle) plus a device FK for audit.

alter table public.time_entries
  add column if not exists kiosk_device_id uuid references public.kiosk_devices(id) on delete set null;

comment on column public.time_entries.kiosk_device_id is
  'Set when the punch was captured on a registered kiosk device (source_channel=''kiosk''). ON DELETE SET NULL — the entry outlives the device registration.';

create index if not exists idx_time_entries_kiosk_device
  on public.time_entries (kiosk_device_id) where kiosk_device_id is not null;

-- Extend the source_channel facet vocabulary with 'kiosk'. The original
-- constraint was authored inline in 20260715135912_time_capture_fidelity, so
-- it carries the default generated name.
alter table public.time_entries
  drop constraint if exists time_entries_source_channel_check;
alter table public.time_entries
  add constraint time_entries_source_channel_check
  check (source_channel in ('app', 'offline_replay', 'manager_entry', 'correction', 'import', 'kiosk'));
