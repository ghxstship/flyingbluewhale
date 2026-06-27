-- LEG3ND live sessions — webinars / cohort labs / instructor-led workshops, with
-- per-learner registrations. Backs the /legend/live surface from the LMS reference
-- app. 3NF, org-scoped, RLS. LDP naming: `*_state` (cyclical).

-- ── Live sessions ──────────────────────────────────────────────────────
create table public.legend_live_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  title text not null,
  description text,
  host_id uuid references auth.users(id) on delete set null,
  host_name text,
  kind text not null default 'webinar' check (kind in ('webinar', 'hands_on', 'workshop', 'cohort')),
  course_id uuid references public.legend_courses(id) on delete set null,
  starts_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  capacity integer check (capacity is null or capacity > 0),
  location text,
  join_url text,
  session_state text not null default 'scheduled' check (session_state in ('scheduled', 'live', 'ended', 'cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index legend_live_sessions_org_idx on public.legend_live_sessions (org_id, starts_at) where deleted_at is null;

alter table public.legend_live_sessions enable row level security;
create policy legend_live_sessions_select on public.legend_live_sessions
  for select using (private.is_org_member(org_id));
create policy legend_live_sessions_write on public.legend_live_sessions
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']));
create trigger trg_legend_live_sessions_updated before update on public.legend_live_sessions
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.legend_live_sessions to authenticated;

-- ── Session registrations (one per learner per session) ────────────────
create table public.legend_session_registrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  session_id uuid not null references public.legend_live_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  registration_state text not null default 'registered' check (registration_state in ('registered', 'waitlisted', 'attended', 'cancelled', 'no_show')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, user_id)
);
create index legend_session_registrations_user_idx on public.legend_session_registrations (org_id, user_id, registration_state);

alter table public.legend_session_registrations enable row level security;
create policy legend_session_registrations_select on public.legend_session_registrations
  for select using (private.is_org_member(org_id) and (user_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin', 'controller'])));
create policy legend_session_registrations_insert on public.legend_session_registrations
  for insert with check (private.is_org_member(org_id) and user_id = auth.uid());
create policy legend_session_registrations_update on public.legend_session_registrations
  for update using (user_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin', 'controller']))
  with check (user_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin', 'controller']));
create trigger trg_legend_session_registrations_updated before update on public.legend_session_registrations
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.legend_session_registrations to authenticated;
