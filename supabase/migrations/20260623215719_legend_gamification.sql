-- Shared gamification model — the single achievement / points / tier spine
-- that LEG3ND (learning) and COMPVSS (field) both read. Achievements earned
-- in either app, points accrue to one ledger, tiers + leaderboard derive from
-- that ledger. 3NF, org-scoped, RLS. LDP naming: `*_state` (cyclical), never
-- bare `status`.
--
-- CODE-READY migration — not applied to the live project here. The operator
-- applies it, then regenerates database.types.ts.

-- ── Achievement catalog ────────────────────────────────────────────────
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  -- tone maps onto the semantic ramp in src/lib/legend_gamification.ts
  tone text not null default 'accent' check (tone in ('accent', 'success', 'warning', 'info', 'neutral')),
  points integer not null default 0 check (points >= 0),
  icon_key text,
  achievement_state text not null default 'active' check (achievement_state in ('active', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (org_id, code)
);
create index achievements_org_idx on public.achievements (org_id, achievement_state) where deleted_at is null;

alter table public.achievements enable row level security;
create policy achievements_select on public.achievements
  for select using (private.is_org_member(org_id));
create policy achievements_write on public.achievements
  for all using (private.has_org_role(org_id, array['owner', 'admin']))
  with check (private.has_org_role(org_id, array['owner', 'admin']));
create trigger trg_achievements_updated before update on public.achievements
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.achievements to authenticated;

-- ── Achievement awards (append-only earn log) ──────────────────────────
create table public.achievement_awards (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- which app credited it
  source text not null default 'legend' check (source in ('legend', 'compvss', 'manual')),
  note text,
  awarded_at timestamptz not null default now(),
  unique (org_id, achievement_id, user_id)
);
create index achievement_awards_user_idx on public.achievement_awards (org_id, user_id, awarded_at desc);

alter table public.achievement_awards enable row level security;
create policy achievement_awards_select on public.achievement_awards
  for select using (private.is_org_member(org_id));
create policy achievement_awards_insert on public.achievement_awards
  for insert with check (private.is_org_member(org_id));
create policy achievement_awards_write on public.achievement_awards
  for all using (private.has_org_role(org_id, array['owner', 'admin']))
  with check (private.has_org_role(org_id, array['owner', 'admin']));
grant select, insert, update, delete on public.achievement_awards to authenticated;

-- ── Points ledger (append-only; leaderboard + tier source of truth) ────
create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  points integer not null,
  reason text not null,
  source text not null default 'legend' check (source in ('legend', 'compvss', 'manual')),
  ref_kind text,
  ref_id uuid,
  created_at timestamptz not null default now()
);
create index points_ledger_user_idx on public.points_ledger (org_id, user_id, created_at desc);
create index points_ledger_board_idx on public.points_ledger (org_id, created_at desc);

alter table public.points_ledger enable row level security;
create policy points_ledger_select on public.points_ledger
  for select using (private.is_org_member(org_id));
create policy points_ledger_insert on public.points_ledger
  for insert with check (private.is_org_member(org_id));
grant select, insert on public.points_ledger to authenticated;

-- ── Loyalty tier configuration ─────────────────────────────────────────
create table public.loyalty_tiers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  tone text not null default 'bronze' check (tone in ('bronze', 'silver', 'gold', 'platinum')),
  threshold integer not null default 0 check (threshold >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);
create index loyalty_tiers_org_idx on public.loyalty_tiers (org_id, threshold);

alter table public.loyalty_tiers enable row level security;
create policy loyalty_tiers_select on public.loyalty_tiers
  for select using (private.is_org_member(org_id));
create policy loyalty_tiers_write on public.loyalty_tiers
  for all using (private.has_org_role(org_id, array['owner', 'admin']))
  with check (private.has_org_role(org_id, array['owner', 'admin']));
create trigger trg_loyalty_tiers_updated before update on public.loyalty_tiers
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.loyalty_tiers to authenticated;
