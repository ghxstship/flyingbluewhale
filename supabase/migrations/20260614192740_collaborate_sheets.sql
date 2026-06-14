-- Collaborate · Sheets (deferred item F3).
--
-- An Airtable-style editable spreadsheet, org-scoped. Two tables:
--   - sheets      : the spreadsheet itself (name/description + a JSONB column
--                   schema [{key,label,type}] + lifecycle).
--   - sheet_rows  : one row per spreadsheet row. `position` orders them; the
--                   cell payload is a free-form JSONB map keyed by column key.
--
-- The column schema lives in `sheets.columns` (JSONB) rather than as real
-- DB columns so a user can add/remove/rename columns from the grid UI without
-- a migration. Cell values are likewise schemaless (`sheet_rows.cells` JSONB),
-- validated app-side (Zod) against the current column schema on save.
--
-- LDP naming discipline: NO bare `status`. The sheet's macro lifecycle is a
-- postgres enum surfaced as `sheet_state` (cyclical operational). Domain-
-- prefixed (`sheet_*`) to avoid collision with any existing enum/table.
--
-- NOT YET APPLIED — write-only PENDING migration. Code uses the LooseSupabase
-- cast until the typed Database is regenerated post-apply.

-- ── enum types ──────────────────────────────────────────────────────────
do $$ begin
  create type public.sheet_state as enum ('active', 'archived');
exception when duplicate_object then null; end $$;

-- ── sheets ──────────────────────────────────────────────────────────────
create table if not exists public.sheets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  description text,
  -- Column schema: array of {key, label, type}. type ∈ text|number|date|checkbox.
  columns jsonb not null default '[]'::jsonb,
  sheet_state public.sheet_state not null default 'active',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists sheets_org_state_idx
  on public.sheets (org_id, sheet_state)
  where deleted_at is null;

alter table public.sheets enable row level security;

create policy sheets_org_select
  on public.sheets for select
  using (private.is_org_member(org_id));

create policy sheets_org_write
  on public.sheets
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger sheets_touch_updated_at
  before update on public.sheets
  for each row execute function public.touch_updated_at();

-- ── sheet_rows ──────────────────────────────────────────────────────────
-- org_id is denormalized onto the child so RLS + org-scoped reads don't have
-- to JOIN through sheets. On sheet delete the rows cascade away. `cells` is a
-- JSONB map keyed by the parent sheet's column keys.
create table if not exists public.sheet_rows (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  sheet_id uuid not null references public.sheets(id) on delete cascade,
  position integer not null default 0,
  cells jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists sheet_rows_sheet_idx
  on public.sheet_rows (org_id, sheet_id, position)
  where deleted_at is null;

alter table public.sheet_rows enable row level security;

create policy sheet_rows_org_select
  on public.sheet_rows for select
  using (private.is_org_member(org_id));

create policy sheet_rows_org_write
  on public.sheet_rows
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger sheet_rows_touch_updated_at
  before update on public.sheet_rows
  for each row execute function public.touch_updated_at();
