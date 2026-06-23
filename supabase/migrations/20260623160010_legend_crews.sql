-- LEG3ND learning crews / cohorts — social-learning teams whose XP rolls up from
-- the shared points_ledger (source='legend'). Distinct from the COMPVSS field
-- `crew_members` (operational rostering). Backs the /legend/crew surface from the
-- LMS reference app. 3NF, org-scoped, RLS. LDP naming: `*_state`.

-- ── Crews / cohorts ────────────────────────────────────────────────────
create table public.legend_crews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  description text,
  crew_state text not null default 'active' check (crew_state in ('active', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (org_id, name)
);
create index legend_crews_org_idx on public.legend_crews (org_id, crew_state) where deleted_at is null;

alter table public.legend_crews enable row level security;
create policy legend_crews_select on public.legend_crews
  for select using (private.is_org_member(org_id));
create policy legend_crews_write on public.legend_crews
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller']));
create trigger trg_legend_crews_updated before update on public.legend_crews
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.legend_crews to authenticated;

-- ── Crew membership (one per learner per crew) ─────────────────────────
create table public.legend_crew_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  crew_id uuid not null references public.legend_crews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  crew_role text not null default 'member' check (crew_role in ('lead', 'member')),
  created_at timestamptz not null default now(),
  unique (crew_id, user_id)
);
create index legend_crew_members_user_idx on public.legend_crew_members (org_id, user_id);
create index legend_crew_members_crew_idx on public.legend_crew_members (org_id, crew_id);

alter table public.legend_crew_members enable row level security;
create policy legend_crew_members_select on public.legend_crew_members
  for select using (private.is_org_member(org_id));
create policy legend_crew_members_write on public.legend_crew_members
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller']));
grant select, insert, update, delete on public.legend_crew_members to authenticated;
