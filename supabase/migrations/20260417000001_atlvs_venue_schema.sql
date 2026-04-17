-- =====================================================================
-- ATLVS | VENUES CORE SCHEMA
-- PostgreSQL 15+ / Supabase
-- 3NF normalized, multi-tenant, globally scalable
-- =====================================================================

create extension if not exists "citext";
create extension if not exists "pg_trgm";

create schema if not exists atlvs;
set search_path = atlvs, public;

-- ---------- ENUMS -----------------------------------------------------

create type capacity_range as enum
  ('micro','small','mid','large','mega','stadium');

create type venue_type_code as enum (
  'nightclub','lounge','bar','event_venue','rooftop','gallery',
  'warehouse','hotel_ballroom','restaurant_private_dining','restaurant',
  'outdoor_space','park','unconventional_space','theater','studio',
  'museum','yacht','beach_club','stadium','sports_venue','banquet_hall',
  'country_club','historic_estate','food_hall','arena'
);

create type rating_source as enum
  ('google','yelp','tripadvisor','opentable','ghxstship','resy','michelin');

create type rating_tier as enum
  ('unrated','below_avg','avg','good','excellent','elite');

create type contact_role as enum
  ('booking','events','general_manager','production','catering',
   'marketing','press','owner','concierge','reservations','sales');

create type social_platform as enum
  ('instagram','facebook','x_twitter','tiktok','linkedin','youtube',
   'threads','whatsapp','telegram','wechat','weibo');

create type data_confidence as enum ('high','medium','low','unverified');

-- ---------- TENANCY ---------------------------------------------------

create table organizations (
  id             uuid primary key default gen_random_uuid(),
  slug           citext unique not null,
  display_name   text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

-- ---------- GEOGRAPHIC HIERARCHY --------------------------------------
-- country -> region_level_1 (state/province) -> region_level_2 (county/metro)
-- -> locality (city/town) -> district (neighborhood/zone)
-- Any level can be omitted if not applicable in a given country.
-- ---------------------------------------------------------------------

create table countries (
  id             uuid primary key default gen_random_uuid(),
  iso_alpha_2    char(2) unique not null,
  iso_alpha_3    char(3) unique not null,
  name           text not null,
  calling_code   text not null,
  default_currency char(3),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

create table region_level_1 (
  id             uuid primary key default gen_random_uuid(),
  country_id     uuid not null references countries(id),
  code           text,
  name           text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  unique (country_id, name)
);

create table region_level_2 (
  id             uuid primary key default gen_random_uuid(),
  region_level_1_id uuid references region_level_1(id),
  country_id     uuid not null references countries(id),
  name           text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  unique (country_id, region_level_1_id, name)
);

create table localities (
  id             uuid primary key default gen_random_uuid(),
  country_id     uuid not null references countries(id),
  region_level_1_id uuid references region_level_1(id),
  region_level_2_id uuid references region_level_2(id),
  name           text not null,
  timezone       text,
  latitude       numeric(9,6),
  longitude      numeric(9,6),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
create index idx_localities_country_name on localities(country_id, name);

create table districts (
  id             uuid primary key default gen_random_uuid(),
  locality_id    uuid not null references localities(id),
  name           text not null,
  slug           citext not null,
  description    text,
  latitude       numeric(9,6),
  longitude      numeric(9,6),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  unique (locality_id, slug)
);
create index idx_districts_locality on districts(locality_id);

-- ---------- LOOKUPS ---------------------------------------------------

create table venue_types (
  id             uuid primary key default gen_random_uuid(),
  code           venue_type_code unique not null,
  display_name   text not null,
  description    text,
  created_at     timestamptz not null default now()
);

create table features (
  id             uuid primary key default gen_random_uuid(),
  slug           citext unique not null,
  display_name   text not null,
  category       text,
  description    text,
  created_at     timestamptz not null default now()
);

-- ---------- VENUES (main) ---------------------------------------------

create table venues (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid references organizations(id),
  slug               citext not null,
  name               text not null,
  legal_name         text,
  venue_type_id      uuid not null references venue_types(id),

  address_line_1     text,
  address_line_2     text,
  postal_code        text,
  locality_id        uuid references localities(id),
  district_id        uuid references districts(id),
  region_level_1_id  uuid references region_level_1(id),
  region_level_2_id  uuid references region_level_2(id),
  country_id         uuid not null references countries(id),
  latitude           numeric(9,6),
  longitude          numeric(9,6),

  capacity_standing  integer,
  capacity_seated    integer,
  capacity_range     capacity_range,

  website_url        text,
  is_active          boolean not null default true,
  active_verified_at timestamptz,
  data_confidence    data_confidence not null default 'unverified',
  production_notes   text,
  internal_notes     text,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz,

  unique (organization_id, slug)
);
create index idx_venues_district on venues(district_id);
create index idx_venues_locality on venues(locality_id);
create index idx_venues_country on venues(country_id);
create index idx_venues_type on venues(venue_type_id);
create index idx_venues_active on venues(is_active) where deleted_at is null;
create index idx_venues_name_trgm on venues using gin (name gin_trgm_ops);

-- ---------- CONTACTS (1:N) --------------------------------------------

create table venue_contacts (
  id             uuid primary key default gen_random_uuid(),
  venue_id       uuid not null references venues(id) on delete cascade,
  role           contact_role not null,
  display_name   text,
  email          citext,
  phone_e164     text,
  phone_extension text,
  is_primary     boolean not null default false,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
create index idx_contacts_venue on venue_contacts(venue_id);
create unique index uniq_primary_contact_per_role
  on venue_contacts(venue_id, role) where is_primary = true and deleted_at is null;

-- ---------- SOCIAL LINKS (1:N) ----------------------------------------

create table venue_social_links (
  id             uuid primary key default gen_random_uuid(),
  venue_id       uuid not null references venues(id) on delete cascade,
  platform       social_platform not null,
  handle         text,
  url            text not null,
  is_primary     boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  unique (venue_id, platform, url)
);
create index idx_social_venue on venue_social_links(venue_id);

-- ---------- RATINGS (multi-source, time-series) -----------------------

create table venue_ratings (
  id             uuid primary key default gen_random_uuid(),
  venue_id       uuid not null references venues(id) on delete cascade,
  source         rating_source not null,
  score          numeric(3,2),
  review_count   integer,
  tier           rating_tier,
  captured_at    timestamptz not null default now(),
  source_url     text,
  created_at     timestamptz not null default now(),
  unique (venue_id, source, captured_at)
);
create index idx_ratings_venue_source on venue_ratings(venue_id, source);

-- ---------- JUNCTION: venue <-> features ------------------------------

create table venue_features (
  venue_id       uuid not null references venues(id) on delete cascade,
  feature_id     uuid not null references features(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (venue_id, feature_id)
);
create index idx_venue_features_feature on venue_features(feature_id);

-- ---------- JUNCTION: venue <-> secondary venue types -----------------

create table venue_type_assignments (
  venue_id       uuid not null references venues(id) on delete cascade,
  venue_type_id  uuid not null references venue_types(id) on delete cascade,
  is_primary     boolean not null default false,
  primary key (venue_id, venue_type_id)
);

-- ---------- TRIGGER: updated_at autoupdate ----------------------------

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'organizations','countries','region_level_1','region_level_2',
      'localities','districts','venues','venue_contacts',
      'venue_social_links'])
  loop
    execute format(
      'drop trigger if exists trg_touch on %I; create trigger trg_touch
       before update on %I for each row execute function touch_updated_at();',
      t, t);
  end loop;
end $$;

-- ---------- RLS SCAFFOLD (Supabase) -----------------------------------

alter table venues enable row level security;
alter table venue_contacts enable row level security;
alter table venue_social_links enable row level security;
alter table venue_ratings enable row level security;
alter table venue_features enable row level security;

create policy venues_public_read on venues
  for select using (deleted_at is null and organization_id is null);

create policy venues_tenant_read on venues
  for select using (
    deleted_at is null
    and organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );
