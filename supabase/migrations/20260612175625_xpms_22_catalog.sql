-- Applied 2026-06-12 via Supabase MCP (version 20260612175625); file
-- recovered from the remote journal to keep local = remote in sync.
-- Source: XPMS 2.0 Kit / 05_Data_Platform/xpms_supabase_migration.sql
--
-- ============================================================
-- XPMS 2.2 CATALOG — SUPABASE MIGRATION V1
-- GHXSTSHIP Industries · 2026-06-10
-- Implements 06_Fuzzy_Search_Spec + T14/T15 of the unification plan.
-- Load order: extensions -> table -> indexes -> staging -> resolver.
-- Data load: COPY xpms_catalog FROM 'xpms_2.2_catalog.csv' (column map below).
-- ============================================================

create extension if not exists pg_trgm;
create extension if not exists vector;

-- ------------------------------------------------------------
-- Core catalog (one row per atom; append-only, version forward)
-- ------------------------------------------------------------
create table if not exists xpms_catalog (
  xpms_atom_id        text primary key,            -- {URID}-{SEQ}
  legacy_handle       text,                        -- retired Bible/source SKU (opaque string)
  name                text not null,
  common_name         text,
  urid                text not null check (urid ~ '^\d{4}\.\d{2}\.\d{2}$'),
  department          text not null,
  discipline          text not null,
  category            text not null,
  kind                text,
  catalog_state       text,                        -- atom lifecycle (LDP *_state; was `status` in the XPMS kit DDL)
  tier                text,
  phase               text,
  xyz                 text,
  team                text,
  description         text,
  specifications      text,
  options             text,
  modifiers           text,
  prerequisites       text,
  pricing_unit        text,
  uom                 text,
  unit_cost_usd       numeric,
  std_low             numeric,
  std_high            numeric,
  basic_low           numeric,
  basic_high          numeric,
  prem_low            numeric,
  prem_high           numeric,
  lead_time_hrs       text,
  setup               text,
  strike              text,
  crew                text,
  power               text,
  footprint           text,
  truck_space         text,
  weather             text,
  critical_path       text,
  client_visible      text,
  sustainability_tags text,
  compliance_tags     text,
  unspsc              text,
  sense               text,
  five_a              text,
  experience_layer    text,
  -- V2 provenance + economics
  alias_array         text,
  keyword_tags        text,
  trigram_string      text,
  misspelling_variants text,
  vendor_ref_primary  text,
  vendor_ref_alt      text,
  price_confidence    text check (price_confidence in ('QUOTED','PUBLISHED','BENCHMARKED','MODELED','N/A')),
  price_source        text,
  price_effective_date text,
  region_code         text,
  currency            text,
  rental_week_multiplier numeric,
  purchase_cost       text,
  replacement_cost    text,
  consumable_flag     boolean default false,
  pack_qty            text,
  freight_class       text,
  weight_lbs          numeric,
  gap_flag            text,
  embedding           vector(1536),                -- pgvector rerank layer (populate async)
  created_at          timestamptz default now()
);

-- ------------------------------------------------------------
-- Weighted full-text vector: A=name, B=common+aliases, C=keywords, D=description
-- ------------------------------------------------------------
alter table xpms_catalog
  add column if not exists fts tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(name,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(common_name,'') || ' ' || coalesce(alias_array,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(keyword_tags,'')), 'C') ||
    setweight(to_tsvector('english', coalesce(description,'')), 'D')
  ) stored;

create index if not exists idx_catalog_fts     on xpms_catalog using gin (fts);
create index if not exists idx_catalog_trgm    on xpms_catalog using gin (trigram_string gin_trgm_ops);
create index if not exists idx_catalog_urid    on xpms_catalog (urid);
create index if not exists idx_catalog_dept    on xpms_catalog (department, discipline, category);
create index if not exists idx_catalog_vec     on xpms_catalog using ivfflat (embedding vector_cosine_ops) with (lists = 50);

-- ------------------------------------------------------------
-- Intake staging: unresolved budget lines land here, never silently priced
-- ------------------------------------------------------------
create table if not exists xpms_catalog_staging (
  id              bigint generated always as identity primary key,
  raw_text        text not null,
  qty             numeric,
  unit_hint       text,
  project_code    text,
  best_atom_id    text references xpms_catalog(xpms_atom_id),
  best_score      numeric,
  disposition     text default 'OPEN'
    check (disposition in ('OPEN','MAPPED','NEW-ATOM-PROPOSED','REJECTED')),
  created_at      timestamptz default now()
);

-- ------------------------------------------------------------
-- Resolver: free text -> ranked atoms (tsquery + trigram blend).
-- Threshold 0.30 per spec; below threshold -> caller inserts into staging.
-- ------------------------------------------------------------
create or replace function resolve_atom(q text, max_rows int default 5)
returns table (
  xpms_atom_id text, name text, common_name text, urid text,
  pricing_unit text, unit_cost_usd numeric,
  std_low numeric, std_high numeric,
  price_confidence text, gap_flag text, score numeric
) language sql stable as $$
  with scored as (
    select c.xpms_atom_id, c.name, c.common_name, c.urid,
           c.pricing_unit, c.unit_cost_usd, c.std_low, c.std_high,
           c.price_confidence, c.gap_flag,
           greatest(
             coalesce(ts_rank(c.fts, websearch_to_tsquery('english', q)), 0),
             similarity(c.trigram_string, lower(q))
           ) as score
    from xpms_catalog c
  )
  select * from scored
  where score >= 0.30
  order by score desc
  limit max_rows;
$$;

comment on function resolve_atom is
  'XPMS resolver per 06_Fuzzy_Search_Spec. Recall target >=95% top-3 on the 100-query slang set (T16). Misses are inserted into xpms_catalog_staging by the caller; fabricated matches are prohibited.';

-- ============================================================
-- S01 ASSEMBLY LAYER — packages + BOM bridge (added 2026-06-10)
-- New atom kinds: 'package' (composite, explodable) and 'opex'
-- (recurring venue operating cost, per-month pricing units).
-- ============================================================
create table if not exists bridge_package_atom (
  id                 bigint generated always as identity primary key,
  package_atom_id    text not null references xpms_catalog(xpms_atom_id),
  component_atom_id  text not null references xpms_catalog(xpms_atom_id),
  qty_formula        text not null default '1',     -- fixed | per-guest | per-sqft | per-day expression
  include_flag       text not null default 'core'
    check (include_flag in ('core','optional','grade-dependent')),
  grade_scope        text default 'all'
    check (grade_scope in ('all','basic','std','prem')),
  unique (package_atom_id, component_atom_id, grade_scope)
);
create index if not exists idx_bom_pkg on bridge_package_atom (package_atom_id);

-- Explode a package into priced component rows (procurement view).
create or replace function explode_package(pkg text)
returns table (component_atom_id text, name text, qty_formula text,
               include_flag text, grade_scope text,
               pricing_unit text, std_low numeric, std_high numeric)
language sql stable as $$
  select b.component_atom_id, c.name, b.qty_formula, b.include_flag, b.grade_scope,
         c.pricing_unit, c.std_low, c.std_high
  from bridge_package_atom b
  join xpms_catalog c on c.xpms_atom_id = b.component_atom_id
  where b.package_atom_id = pkg
  order by b.include_flag, c.name;
$$;

-- Bottom-up integrity check: package band vs SUM(component std bands).
-- Divergence > 15% should flag the package for re-spec (forecast confidence rule).
create or replace view v_package_band_check as
  select p.xpms_atom_id, p.name,
         p.std_low  as package_std_low,
         p.std_high as package_std_high,
         sum(c.std_low)  as bom_std_low,
         sum(c.std_high) as bom_std_high
  from xpms_catalog p
  join bridge_package_atom b on b.package_atom_id = p.xpms_atom_id
  join xpms_catalog c on c.xpms_atom_id = b.component_atom_id
  where p.kind = 'package'
  group by 1,2,3,4;

-- ============================================================
-- XMCE — METRIC & COMPLIANCE ENGINE (added 2026-06-10)
-- Calculators are facets/tools, not atoms. Atoms feed metrics
-- via bridges; permits trigger off atoms or thresholds.
-- ============================================================
create table if not exists dim_metric (
  metric_id     text primary key,           -- e.g. CAP-OL, RR-ADA, PWR-GEN
  name          text not null,
  formula       text not null,              -- human-readable formula
  inputs        text,                       -- input registry
  source        text,                       -- IBC 1004.5 / IPC 403.1 / ADA 213 / MODELED
  confidence    text check (confidence in ('CODE','STANDARD','MODELED'))
);

create table if not exists bridge_atom_metric (
  atom_id    text references xpms_catalog(xpms_atom_id),
  metric_id  text references dim_metric(metric_id),
  role       text default 'input',          -- input | trigger | output-target
  primary key (atom_id, metric_id)
);

create table if not exists dim_permit (
  permit_id   text primary key,             -- e.g. PRM-TENT, PRM-PYRO
  name        text not null,
  trigger_type text check (trigger_type in ('atom','threshold','project','condition')),
  condition   text,                         -- e.g. 'occupant_load >= 50', 'tent_sqft > 100'
  ahj_default text,                         -- Miami-Dade default; market dim overrides
  lead_time   text
);

create table if not exists bridge_atom_permit (
  atom_id    text references xpms_catalog(xpms_atom_id),
  permit_id  text references dim_permit(permit_id),
  note       text,
  primary key (atom_id, permit_id)
);

-- Budget binding hook: surface permits for every atom on a budget.
create or replace view v_line_permit_flags as
  select b.atom_id, c.name as atom_name, p.permit_id, p.name as permit,
         p.ahj_default, p.lead_time
  from bridge_atom_permit b
  join xpms_catalog c on c.xpms_atom_id = b.atom_id
  join dim_permit  p on p.permit_id    = b.permit_id;
