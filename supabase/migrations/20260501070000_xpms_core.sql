-- flyingbluewhale · XPMS — Experiential Project Management System (v1.0)
--
-- Whitepaper: docs/decisions/ADR-0002-xpms-spine.md (to follow).
--
-- This migration installs the XPMS spine described in the v1.0 whitepaper:
--   • XTC Protocol™ codebook  (Class → Division → Section → Line Item)
--   • Atomic Production System (atoms, dual-state UAC/TPC)
--   • Six Tiers of Experience (per-atom + per-project composition)
--   • Eight Production Phases (8PP — replaces ad-hoc phase strings)
--   • Variance Ledger        (UAC ↔ TPC delta as a first-class object)
--   • Provenance Graph       (cross-class edges, queryable from any vertex)
--
-- No backwards compatibility: a follow-up migration migrates existing
-- cost_codes / crew / equipment / advances into atoms and removes the
-- duplicated single-purpose tables.
--
-- Conventions:
--   * Every table org-scoped, RLS-enforced via is_org_member / has_org_role
--   * Every code-bearing surface stable forever (append-only governance)

------------------------------------------------------------------
-- 1. Enums — phases, states, tiers, faces, scope, structure, style
------------------------------------------------------------------

create type xpms_phase as enum (
  'discovery',     -- 1 · brief intake, scope qualification
  'concept',       -- 2 · creative direction, narrative
  'development',   -- 3 · technical design, costing
  'advance',       -- 4 · pre-prod logistics, permits, ROS
  'build',         -- 5 · fabrication, load-in, programming
  'show',          -- 6 · live execution, daily ops
  'strike',        -- 7 · load-out, return logistics
  'wrap'           -- 8 · reconciliation, debrief, billing
);

create type xpms_state as enum (
  'uac',           -- planned (Universal Advance Catalog)
  'tpc'            -- deployed (Total Production Catalog)
);

create type xpms_tier as enum (
  'social',        -- 01
  'digital',       -- 02
  'virtual',       -- 03
  'physical',      -- 04
  'experiential',  -- 05
  'theatrical'     -- 06
);

create type xtc_face as enum (
  'org',           -- organisational assignment surface
  'finance',       -- financial posting surface
  'both'           -- usable in either context
);

create type xpms_geo_scope as enum (
  'local','regional','national','international'
);

create type xpms_tour_structure as enum (
  'single_stop','multi_stop_sequential','simultaneous_multi_city'
);

create type xpms_production_style as enum (
  'editorial','documentary','narrative','spectacle','intimate','brutalist'
);

create type xpms_variance_reason as enum (
  'no_show','substitution','quantity_delta','spec_change','damage','loss',
  'overtime','weather','client_change','vendor_change','other'
);

------------------------------------------------------------------
-- 2. XTC Protocol™ — the ten-class codebook
--
-- Class       X      — domain of work          (10 classes)
-- Division    XY     — major functional area   (9 per class)
-- Section     XYZ    — specific sub-domain     (9 per division)
-- Line item   XYZWW  — atomic addressable code (99 per section)
-- → 80,190 unique addressable codes
--
-- Faces:
--   org      → assignment / RBAC
--   finance  → posting / budgeting
--   both     → usable in either
------------------------------------------------------------------

create table xtc_classes (
  code         smallint primary key check (code between 0 and 9),
  name         text    not null unique,                  -- 'EXECUTIVE'…'TECHNOLOGY'
  domain       text    not null,                         -- one-line domain summary
  ord          smallint not null,                        -- display ordering (0..9)
  description  text,
  created_at   timestamptz not null default now()
);

create table xtc_divisions (
  code         smallint not null check (code between 0 and 99),  -- two-digit XY
  class_code   smallint not null references xtc_classes(code) on delete restrict,
  digit        smallint not null check (digit between 0 and 9),  -- the Y
  name         text not null,
  description  text,
  created_at   timestamptz not null default now(),
  primary key (code),
  unique (class_code, digit)
);

create table xtc_sections (
  code           smallint not null check (code between 0 and 999),  -- three-digit XYZ
  division_code  smallint not null references xtc_divisions(code) on delete restrict,
  digit          smallint not null check (digit between 0 and 9),
  name           text not null,
  description    text,
  created_at     timestamptz not null default now(),
  primary key (code),
  unique (division_code, digit)
);

create table xtc_codes (
  code           int    primary key check (code between 0 and 99999),  -- five-digit XYZWW
  section_code   smallint not null references xtc_sections(code) on delete restrict,
  line_digit     smallint not null check (line_digit between 0 and 99),
  name           text not null,
  face           xtc_face not null,
  description    text,
  -- Position-code convention: line items XYZW0 are position roots; XYZW1..9
  -- are reserved for related rate variants (day rate, OT, weekend, hazard).
  is_position_root boolean not null default false,
  -- Reserved-range tag (X800–X999 across every level = org-private extensions)
  reserved_range  boolean not null default false,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (section_code, line_digit)
);

create index xtc_codes_face_idx on xtc_codes(face);
create index xtc_codes_section_idx on xtc_codes(section_code);

comment on table  xtc_classes  is 'XPMS · XTC Protocol — ten top-level classes (0..9).';
comment on table  xtc_divisions is 'XPMS · XTC Protocol — divisions (XY) within each class.';
comment on table  xtc_sections is 'XPMS · XTC Protocol — sections (XYZ) within each division.';
comment on table  xtc_codes    is 'XPMS · XTC Protocol — five-digit line-item codes (XYZWW). Append-only; codes are stable forever.';
comment on column xtc_codes.face is 'org | finance | both — determines whether a code drives RBAC, postings, or both.';

------------------------------------------------------------------
-- 3. Atomic Production System — the atoms
--
-- The smallest individually addressable unit of production work.
-- Hierarchy: Class → Division → Section → Atom.
-- Identifier: {ORG}-{EVT}{YY}{VEN}-{CLASS}.{DIV}.{SEC}-{ZON}-{SEQ}{REV}
------------------------------------------------------------------

create table xpms_atoms (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs(id) on delete cascade,
  project_id      uuid references projects(id) on delete set null,

  -- Address
  identifier      text not null,                              -- canonical APS identifier string
  xtc_code        int  not null references xtc_codes(code) on delete restrict,
  class_code      smallint not null references xtc_classes(code) on delete restrict,
  division_code   smallint not null references xtc_divisions(code) on delete restrict,
  section_code    smallint not null references xtc_sections(code) on delete restrict,

  -- Identifier components (for query + reconstruction)
  org_token       text not null,                              -- e.g. GHX
  event_token     text,                                       -- e.g. MMW
  event_year      smallint,                                   -- e.g. 26
  venue_token     text,                                       -- e.g. HP
  zone_token      text,                                       -- e.g. FOH, BAR3
  sequence_no     int  not null,                              -- e.g. 0017
  revision        text not null default 'A',                  -- e.g. A, B, C, AA

  -- Lifecycle
  state           xpms_state not null default 'uac',
  phase           xpms_phase not null default 'discovery',

  -- Content
  name            text not null,
  description     text,
  quantity        numeric(14,4) not null default 1,           -- atoms can carry counts (e.g. 25 decks)
  unit            text,                                       -- 'each', 'sqft', 'shift', 'lot'
  cost_cents      bigint,                                     -- planned/actual cost in cents
  currency        char(3) not null default 'USD',

  -- Cross-cutting metadata (XPMS extensibility surface)
  tags            text[] not null default '{}',               -- sustainability, accessibility, ai_provenance, …
  payload         jsonb  not null default '{}'::jsonb,        -- class-specific structured data

  -- UAC/TPC pairing (TPC.uac_origin → UAC; UAC has no origin)
  uac_origin_id   uuid references xpms_atoms(id) on delete set null,

  -- Versioning + audit
  lineage_root_id uuid references xpms_atoms(id) on delete set null,
  owner_user_id   uuid references users(id) on delete set null,
  created_by      uuid not null references users(id) on delete restrict,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (org_id, identifier),
  -- TPC must trace back to a UAC; UAC must not have an origin
  check ((state = 'tpc' and uac_origin_id is not null) or
         (state = 'uac' and uac_origin_id is null))
);

create index xpms_atoms_org_idx        on xpms_atoms(org_id);
create index xpms_atoms_project_idx    on xpms_atoms(project_id);
create index xpms_atoms_xtc_idx        on xpms_atoms(xtc_code);
create index xpms_atoms_class_idx      on xpms_atoms(class_code);
create index xpms_atoms_phase_idx      on xpms_atoms(phase);
create index xpms_atoms_state_idx      on xpms_atoms(state);
create index xpms_atoms_uac_origin_idx on xpms_atoms(uac_origin_id) where uac_origin_id is not null;
create index xpms_atoms_tags_gin       on xpms_atoms using gin (tags);
create index xpms_atoms_payload_gin    on xpms_atoms using gin (payload jsonb_path_ops);

create trigger xpms_atoms_touch_updated_at
  before update on xpms_atoms
  for each row execute function touch_updated_at();

comment on table  xpms_atoms is 'XPMS · APS — atomic production unit. Every element of a production is an atom.';
comment on column xpms_atoms.identifier is '{ORG}-{EVT}{YY}{VEN}-{CLASS}.{DIV}.{SEC}-{ZON}-{SEQ}{REV}';
comment on column xpms_atoms.state      is 'uac (planned) | tpc (deployed). Variance is computed from the pair.';
comment on column xpms_atoms.tags       is 'Cross-cutting metadata — extensibility layer. Classes are immutable; tags evolve.';

------------------------------------------------------------------
-- 4. Six Tiers of Experience — per-atom composition
--
-- One primary tier per atom; zero-or-more secondary tiers with weight.
------------------------------------------------------------------

create table xpms_atom_tiers (
  atom_id    uuid not null references xpms_atoms(id) on delete cascade,
  tier       xpms_tier not null,
  is_primary boolean not null default false,
  weight     numeric(4,3) not null default 1.000 check (weight >= 0 and weight <= 1),
  primary key (atom_id, tier)
);

create index xpms_atom_tiers_tier_idx on xpms_atom_tiers(tier);

-- An atom must have exactly one primary tier
create unique index xpms_atom_tiers_one_primary
  on xpms_atom_tiers(atom_id) where is_primary;

comment on table xpms_atom_tiers is 'XPMS · per-atom tier composition. Each atom carries one primary tier and zero+ secondaries with weight.';

------------------------------------------------------------------
-- 5. Variance Ledger — UAC ↔ TPC delta as a first-class object
------------------------------------------------------------------

create table xpms_variance_ledger (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs(id) on delete cascade,
  uac_atom_id     uuid not null references xpms_atoms(id) on delete cascade,
  tpc_atom_id     uuid          references xpms_atoms(id) on delete cascade,
  reason          xpms_variance_reason not null,
  qty_delta       numeric(14,4),
  cost_delta_cents bigint,
  notes           text,
  recorded_at     timestamptz not null default now(),
  recorded_by     uuid not null references users(id) on delete restrict
);

create index xpms_variance_org_idx     on xpms_variance_ledger(org_id);
create index xpms_variance_uac_idx     on xpms_variance_ledger(uac_atom_id);
create index xpms_variance_tpc_idx     on xpms_variance_ledger(tpc_atom_id);
create index xpms_variance_reason_idx  on xpms_variance_ledger(reason);

comment on table xpms_variance_ledger is 'XPMS · variance ledger. Every UAC ↔ TPC delta is a first-class entry with a reason code.';

------------------------------------------------------------------
-- 6. Provenance Graph — cross-class edges
--
-- Three primary relationship kinds (whitepaper §11):
--   assignment  — Operations atom assigned to Production/Build atom
--   authorship  — Creative atom authored by Operations atom (with refs)
--   provenance  — TPC traces back to UAC, people, documents, artifacts
------------------------------------------------------------------

create type xpms_edge_kind as enum (
  'assignment','authorship','provenance','reference','consumes','produces'
);

create table xpms_provenance_edges (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs(id) on delete cascade,
  from_atom_id    uuid not null references xpms_atoms(id) on delete cascade,
  to_atom_id      uuid not null references xpms_atoms(id) on delete cascade,
  kind            xpms_edge_kind not null,
  payload         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  created_by      uuid not null references users(id) on delete restrict,
  unique (from_atom_id, to_atom_id, kind),
  check (from_atom_id <> to_atom_id)
);

create index xpms_edges_org_idx   on xpms_provenance_edges(org_id);
create index xpms_edges_from_idx  on xpms_provenance_edges(from_atom_id);
create index xpms_edges_to_idx    on xpms_provenance_edges(to_atom_id);
create index xpms_edges_kind_idx  on xpms_provenance_edges(kind);

comment on table xpms_provenance_edges is 'XPMS · provenance graph. Every edge crosses two atoms with a typed relationship.';

------------------------------------------------------------------
-- 7. Project descriptive vector (Composition)
--
-- Project carries: tier composition + geographic scope + tour structure
-- + production style + dates + venues + client + phase trajectory.
------------------------------------------------------------------

alter table projects
  add column if not exists xpms_phase           xpms_phase    not null default 'discovery',
  add column if not exists geographic_scope     xpms_geo_scope,
  add column if not exists tour_structure       xpms_tour_structure,
  add column if not exists production_style     xpms_production_style,
  add column if not exists event_token          text,
  add column if not exists venue_token          text,
  add column if not exists primary_venue_id     uuid references venues(id) on delete set null;

create index if not exists projects_xpms_phase_idx on projects(xpms_phase);

create table xpms_project_composition (
  project_id     uuid not null references projects(id) on delete cascade,
  tier           xpms_tier not null,
  share          numeric(5,4) not null check (share >= 0 and share <= 1),  -- 0..1
  metric         text not null default 'scope',                            -- 'scope'|'budget'|'count'
  computed_at    timestamptz not null default now(),
  primary key (project_id, tier, metric)
);

create index xpms_composition_tier_idx on xpms_project_composition(tier);

comment on table xpms_project_composition is 'XPMS · project tier composition. Aggregate distribution across the six tiers per metric.';

------------------------------------------------------------------
-- 8. Cross-table XTC plumbing — replace cost_code linkage with xtc_code
--
-- cost_codes table remains as a free-form bucket for legacy postings;
-- new postings should reference xtc_code directly via the column below.
------------------------------------------------------------------

alter table time_entries
  add column if not exists xtc_code int references xtc_codes(code) on delete set null,
  add column if not exists atom_id  uuid references xpms_atoms(id) on delete set null;
create index if not exists time_entries_xtc_idx  on time_entries(xtc_code) where xtc_code is not null;
create index if not exists time_entries_atom_idx on time_entries(atom_id)  where atom_id is not null;

alter table expenses
  add column if not exists xtc_code int references xtc_codes(code) on delete set null,
  add column if not exists atom_id  uuid references xpms_atoms(id) on delete set null;
create index if not exists expenses_xtc_idx  on expenses(xtc_code) where xtc_code is not null;
create index if not exists expenses_atom_idx on expenses(atom_id)  where atom_id is not null;

alter table po_line_items
  add column if not exists xtc_code int references xtc_codes(code) on delete set null,
  add column if not exists atom_id  uuid references xpms_atoms(id) on delete set null;
create index if not exists po_line_items_xtc_idx  on po_line_items(xtc_code) where xtc_code is not null;
create index if not exists po_line_items_atom_idx on po_line_items(atom_id)  where atom_id is not null;

alter table invoice_line_items
  add column if not exists xtc_code int references xtc_codes(code) on delete set null,
  add column if not exists atom_id  uuid references xpms_atoms(id) on delete set null;
create index if not exists invoice_line_items_xtc_idx  on invoice_line_items(xtc_code) where xtc_code is not null;
create index if not exists invoice_line_items_atom_idx on invoice_line_items(atom_id)  where atom_id is not null;

alter table budgets
  add column if not exists xtc_code int references xtc_codes(code) on delete set null;
create index if not exists budgets_xtc_idx on budgets(xtc_code) where xtc_code is not null;

------------------------------------------------------------------
-- 9. Row-level security — XPMS surface
--
-- Codebook tables are global / read-anyone-authenticated.
-- Atom-bearing tables are org-scoped.
------------------------------------------------------------------

alter table xtc_classes              enable row level security;
alter table xtc_divisions            enable row level security;
alter table xtc_sections             enable row level security;
alter table xtc_codes                enable row level security;
alter table xpms_atoms               enable row level security;
alter table xpms_atom_tiers          enable row level security;
alter table xpms_variance_ledger     enable row level security;
alter table xpms_provenance_edges    enable row level security;
alter table xpms_project_composition enable row level security;

-- Codebook is global read for any authenticated user; mutations restricted
-- to platform owners/admins (append-only governance).
create policy xtc_classes_read   on xtc_classes   for select to authenticated using (true);
create policy xtc_divisions_read on xtc_divisions for select to authenticated using (true);
create policy xtc_sections_read  on xtc_sections  for select to authenticated using (true);
create policy xtc_codes_read     on xtc_codes     for select to authenticated using (true);

-- Atom-bearing tables: org-scoped via canonical helpers.
create policy xpms_atoms_select on xpms_atoms for select using (is_org_member(org_id));
create policy xpms_atoms_write  on xpms_atoms for all
  using (has_org_role(org_id, array['owner','admin','controller','collaborator']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));

create policy xpms_atom_tiers_select on xpms_atom_tiers for select
  using (exists (select 1 from xpms_atoms a where a.id = atom_id and is_org_member(a.org_id)));
create policy xpms_atom_tiers_write on xpms_atom_tiers for all
  using (exists (select 1 from xpms_atoms a where a.id = atom_id and has_org_role(a.org_id, array['owner','admin','controller','collaborator'])))
  with check (exists (select 1 from xpms_atoms a where a.id = atom_id and has_org_role(a.org_id, array['owner','admin','controller','collaborator'])));

create policy xpms_variance_select on xpms_variance_ledger for select using (is_org_member(org_id));
create policy xpms_variance_write  on xpms_variance_ledger for all
  using (has_org_role(org_id, array['owner','admin','controller','collaborator']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));

create policy xpms_edges_select on xpms_provenance_edges for select using (is_org_member(org_id));
create policy xpms_edges_write  on xpms_provenance_edges for all
  using (has_org_role(org_id, array['owner','admin','controller','collaborator']))
  with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));

create policy xpms_composition_select on xpms_project_composition for select
  using (exists (select 1 from projects p where p.id = project_id and is_org_member(p.org_id)));
create policy xpms_composition_write on xpms_project_composition for all
  using (exists (select 1 from projects p where p.id = project_id and has_org_role(p.org_id, array['owner','admin','controller'])))
  with check (exists (select 1 from projects p where p.id = project_id and has_org_role(p.org_id, array['owner','admin','controller'])));

------------------------------------------------------------------
-- 10. Strategic-query convenience views
------------------------------------------------------------------

create or replace view v_xtc_codebook as
  select c.code as class_code, c.name as class_name, c.domain,
         d.code as division_code, d.name as division_name,
         s.code as section_code, s.name as section_name,
         x.code as line_code, x.name as line_name, x.face, x.is_position_root, x.reserved_range
  from xtc_classes c
  join xtc_divisions d on d.class_code = c.code
  join xtc_sections  s on s.division_code = d.code
  join xtc_codes     x on x.section_code = s.code
  order by c.code, d.code, s.code, x.code;

create or replace view v_xpms_atom_tier_composition as
  select a.org_id, a.project_id, t.tier,
         count(*)               as atom_count,
         sum(coalesce(a.cost_cents,0)) as cost_cents
  from xpms_atoms a
  join xpms_atom_tiers t on t.atom_id = a.id and t.is_primary
  group by a.org_id, a.project_id, t.tier;

create or replace view v_xpms_variance_summary as
  select v.org_id,
         a.project_id,
         a.class_code,
         v.reason,
         count(*) as entries,
         sum(coalesce(v.qty_delta,0))         as qty_delta_total,
         sum(coalesce(v.cost_delta_cents,0))  as cost_delta_cents_total
  from xpms_variance_ledger v
  join xpms_atoms a on a.id = v.uac_atom_id
  group by v.org_id, a.project_id, a.class_code, v.reason;

------------------------------------------------------------------
-- 11. Identifier helpers — build APS identifier strings
------------------------------------------------------------------

create or replace function xpms_build_identifier(
  p_org_token   text,
  p_event_token text,
  p_event_year  smallint,
  p_venue_token text,
  p_class       smallint,
  p_division    smallint,    -- the Y digit (0..9), not the full XY
  p_section     smallint,    -- the Z digit (0..9), not the full XYZ
  p_zone_token  text,
  p_sequence_no int,
  p_revision    text
) returns text
language sql immutable as $$
  select format(
    '%s-%s%s%s-%s.%s.%s-%s-%s%s',
    upper(p_org_token),
    upper(p_event_token),
    lpad(p_event_year::text, 2, '0'),
    upper(p_venue_token),
    p_class::text,
    p_division::text,
    p_section::text,
    upper(p_zone_token),
    lpad(p_sequence_no::text, 4, '0'),
    upper(p_revision)
  );
$$;

comment on function xpms_build_identifier is 'XPMS · build canonical APS identifier: {ORG}-{EVT}{YY}{VEN}-{CLASS}.{DIV}.{SEC}-{ZON}-{SEQ}{REV}.';
