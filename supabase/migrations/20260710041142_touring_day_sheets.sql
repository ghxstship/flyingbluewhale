-- Tour Management (kit 26) — the one genuinely new road artifact: `day_sheets`.
--
-- A tour is a routed run of dates for a rostered artist, expressed as a SCOPE
-- across the existing canonical stores — never a silo. The touring layer adds
-- only TWO stores: `tours` (the spine — ALREADY EXISTS in the repo, with the
-- `tour_p_and_l` roll-up view and `talent_offers.tour_id` routed dates) and
-- `day_sheets` (this migration). Every other touring "noun" (travel, comps,
-- merch, settlement, routing) is an existing table read by `tour_id` — no
-- parallel tables. See docs handoff `TOUR_MANAGEMENT_REPO_UPDATE.md`.
--
-- A day sheet is one composed page per date: crew call · doors · headline set ·
-- curfew, plus schedule/travel/venue/personnel pulled by `tour_id` + `project_id`
-- at read time. Only its own header fields are stored (SSOT — it references, it
-- does not copy). It renders to PDF (reusing the Boarding-Pass / Guides renderer)
-- and pushes to the COMPVSS Field crew PWA.
--
-- LDP naming discipline: NO bare `status`. The lifecycle is a NAMED postgres
-- enum on a `*_state` column (cyclical operational). RLS: org members read;
-- manager+ writes (the canonical band).

do $$ begin
  create type public.day_sheet_state as enum ('not_started','draft','published','updated');
exception when duplicate_object then null; end $$;

create table if not exists public.day_sheets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  tour_id uuid references public.tours(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  city text,
  venue text,
  sheet_date date,
  crew_call time,
  doors time,
  headline_set text,          -- a range like "21:00-22:45" — free text, not a point time
  curfew time,
  owner_id uuid references auth.users(id) on delete set null,
  notes text,
  sheet_state public.day_sheet_state not null default 'not_started',
  published_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists day_sheets_org_tour_idx on public.day_sheets (org_id, tour_id) where deleted_at is null;
create index if not exists day_sheets_org_project_idx on public.day_sheets (org_id, project_id) where deleted_at is null;
create index if not exists day_sheets_org_date_idx on public.day_sheets (org_id, sheet_date) where deleted_at is null;

alter table public.day_sheets enable row level security;
create policy day_sheets_org_select on public.day_sheets for select using (private.is_org_member(org_id));
create policy day_sheets_org_write on public.day_sheets using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create trigger day_sheets_touch_updated_at before update on public.day_sheets for each row execute function public.touch_updated_at();
