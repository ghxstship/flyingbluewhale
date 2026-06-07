-- USNP canon types + tables, in `IF NOT EXISTS` form so the remote (which
-- already has them — they were created by the consolidated 270+ earlier
-- migrations now squashed into 0001_remote_snapshot.sql) is a no-op, and
-- the local Docker `supabase db reset` can satisfy the downstream LDP
-- lifecycle migrations (0020 onward) that reference these types/tables.
--
-- Background: 0001_remote_snapshot.sql was generated from a pg_dump of
-- the remote schema, but the dump skipped a subset of USNP canon types
-- (uis_lifecycle_state, ual_state, accounting_period_state,
-- subscription_state, production_phase, xpms_phase, offer_letter_status,
-- uis_role_class) and their backing tables (uis_roles, asset_movements,
-- accounting_periods). On a fresh local DB, 0020 then failed with
-- `type "uis_lifecycle_state" does not exist`. This file is the
-- minimum-surface idempotent restoration of those objects.
--
-- Every CREATE here uses `IF NOT EXISTS` (or wraps in a DO block with a
-- catch on duplicate_object) so re-applying is safe. The remote tracker
-- records this as applied; the schema state on the remote is unchanged.

-- ─── enums ───────────────────────────────────────────────────────────
do $$ begin
  create type public.uis_lifecycle_state as enum (
    'discovered', 'interested', 'vetted', 'committed',
    'enabled', 'confirmed', 'active', 'closed', 'archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.uis_role_class as enum (
    'executive', 'designer', 'performer', 'speaker',
    'marketing_seller', 'sponsor', 'sponsor_ambassador', 'press',
    'build_vendor', 'production_crew', 'operations',
    'security_medical', 'volunteer', 'guest', 'vip', 'member',
    'hospitality_vendor', 'technology_vendor', 'client',
    'delegate', 'workforce', 'agency', 'staff'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ual_state as enum (
    'acquired', 'available', 'reserved', 'in_transit',
    'in_use', 'returned', 'in_maintenance', 'retired', 'lost'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.accounting_period_state as enum (
    'OPEN', 'IN_PERIOD', 'CLOSING', 'CLOSED', 'AUDITED', 'ARCHIVED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_state as enum (
    'PROSPECT', 'TRIAL', 'ACTIVE', 'RENEWED', 'LAPSED',
    'REACTIVATED', 'CHURNED', 'ARCHIVED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.production_phase as enum (
    'DISCOVERY', 'CONCEPT', 'ENGINEERING', 'PRE_PRO',
    'FAB', 'LOGISTICS', 'INSTALL', 'STRIKE', 'ARCHIVED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.xpms_phase as enum (
    'discovery', 'concept', 'development', 'advance',
    'build', 'show', 'strike', 'wrap'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.offer_letter_status as enum (
    'draft', 'sent', 'viewed', 'accepted', 'countersigned',
    'active', 'declined', 'withdrawn', 'expired',
    'superseded', 'voided'
  );
exception when duplicate_object then null; end $$;

-- ─── tables ──────────────────────────────────────────────────────────
create table if not exists public.uis_roles (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.orgs(id) on delete cascade,
  party_id        uuid not null,
  project_id      uuid,
  role_class      public.uis_role_class not null,
  channel         text not null,
  lifecycle_state public.uis_lifecycle_state not null default 'discovered',
  xtc_class       integer,
  xtc_tier        integer,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.asset_movements (
  id                   uuid primary key default gen_random_uuid(),
  asset_id             uuid not null,
  movement_kind        text not null,
  from_state           public.ual_state,
  to_state             public.ual_state not null,
  from_place_id        uuid,
  to_place_id          uuid,
  from_custodian_id    uuid,
  to_custodian_id      uuid,
  reservation_starts_at timestamptz,
  reservation_ends_at  timestamptz,
  reference_kind       text,
  reference_id         uuid,
  notes                text,
  occurred_at          timestamptz not null default now(),
  recorded_by          uuid
);

create table if not exists public.accounting_periods (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.orgs(id) on delete cascade,
  period_label text not null,
  starts_on    date not null,
  ends_on      date not null,
  -- `status text` is the legacy column kept for back-compat. The remote
  -- carried it until 20260510153432_drop_accounting_periods_legacy_status
  -- removed it; the LDP wave-2 migration `0020` references it inside an
  -- UPDATE that's intended to backfill the typed `state` column. Keeping
  -- the column here (nullable, no constraint) lets 0020 parse on a
  -- fresh local DB without surprising the consolidated remote.
  status       text,
  closed_at    timestamptz,
  closed_by    uuid,
  created_at   timestamptz not null default now(),
  state        public.accounting_period_state not null default 'OPEN'
);

-- RLS — defer to the LDP/USNP migrations downstream for the canonical
-- policies; here we only enable so the downstream `alter table ... force`
-- statements don't trip on disabled RLS.
alter table public.uis_roles          enable row level security;
alter table public.asset_movements    enable row level security;
alter table public.accounting_periods enable row level security;
