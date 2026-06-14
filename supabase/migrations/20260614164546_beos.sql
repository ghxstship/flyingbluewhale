-- BEOs (Banquet Event Orders) — ATLVS Sales & CRM.
--
-- A BEO is a banquet event order document tied to a booking/event. It
-- carries a header (event name, client, date, space, headcount) plus
-- line sections (F&B, AV, staffing) as child line items. Mirrors the
-- TripleSeat BEO document model.
--
-- Two tables:
--   public.beos            — the document header + lifecycle state.
--   public.beo_line_items  — F&B / AV / staffing / rentals / labor lines.
--
-- LDP: the BEO lifecycle is a cyclical operational arc (a BEO can be
-- revised and re-sent), so the column is `beo_state` — NOT `status` —
-- backed by a dedicated postgres enum type `beo_state`.

-- ── lifecycle enum ──────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'beo_state') then
    create type public.beo_state as enum ('draft', 'sent', 'signed', 'revised', 'void');
  end if;
end $$;

-- line-section discriminator (which banquet section a line belongs to)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'beo_line_section') then
    create type public.beo_line_section as enum ('food_beverage', 'av', 'staffing', 'rentals', 'labor', 'other');
  end if;
end $$;

-- ── header table ────────────────────────────────────────────────────
create table if not exists public.beos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  -- optional links into the rest of the CRM. nullable so an operator can
  -- draft a BEO before a client / project row exists.
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  -- header fields
  beo_number text,
  event_name text not null,
  event_date date,
  start_time time,
  end_time time,
  space text,                       -- room / venue space
  headcount integer not null default 0 check (headcount >= 0),
  contact_name text,
  contact_email text,
  contact_phone text,
  beo_state public.beo_state not null default 'draft',
  -- revision tracking — increments each time the BEO is revised + re-sent
  revision integer not null default 1 check (revision >= 1),
  notes text,
  -- lifecycle timestamps
  sent_at timestamptz,
  signed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists beos_org_idx
  on public.beos (org_id, event_date);
create index if not exists beos_org_state_idx
  on public.beos (org_id, beo_state);
create index if not exists beos_client_idx
  on public.beos (org_id, client_id);
create index if not exists beos_project_idx
  on public.beos (org_id, project_id);

alter table public.beos enable row level security;

create policy beos_org_select
  on public.beos for select
  using (private.is_org_member(org_id));

create policy beos_org_write
  on public.beos
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger beos_touch_updated_at
  before update on public.beos
  for each row execute function public.touch_updated_at();

-- ── line items table ────────────────────────────────────────────────
create table if not exists public.beo_line_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  beo_id uuid not null references public.beos(id) on delete cascade,
  section public.beo_line_section not null default 'food_beverage',
  name text not null,
  description text,
  quantity numeric(12, 2) not null default 1 check (quantity >= 0),
  unit_price_cents bigint not null default 0 check (unit_price_cents >= 0),
  -- generated extended total so callers never have to recompute qty * unit
  line_total_cents bigint generated always as
    ((round(quantity * unit_price_cents))::bigint) stored,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists beo_line_items_beo_idx
  on public.beo_line_items (org_id, beo_id, section, sort_order);

alter table public.beo_line_items enable row level security;

create policy beo_line_items_org_select
  on public.beo_line_items for select
  using (private.is_org_member(org_id));

create policy beo_line_items_org_write
  on public.beo_line_items
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger beo_line_items_touch_updated_at
  before update on public.beo_line_items
  for each row execute function public.touch_updated_at();
