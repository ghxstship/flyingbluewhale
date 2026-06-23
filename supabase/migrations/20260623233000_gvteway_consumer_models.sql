-- ============================================================================
-- GVTEWAY consumer — resolve the three "wired-but-no-model" onsite gaps
-- (design_handoff §3): order-to-seat MENU, an onsite POINTS ledger
-- (gamification), and a SCENE↔EVENT link (the scene "events" tab). 3NF + RLS,
-- LDP-clean (no bare `status`; lifecycle columns are `*_state`).
-- ============================================================================

-- ── Order-to-seat: the F&B / merch menu ─────────────────────────────────────
create table if not exists public.venue_menu_item (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.orgs (id) on delete cascade,
  project_id   uuid references public.projects (id) on delete cascade,
  category     text not null check (category in ('food','drink','merch')),
  name         text not null,
  description  text,
  price_cents  int  not null default 0,
  is_available boolean not null default true,
  created_at   timestamptz not null default now()
);
alter table public.venue_menu_item enable row level security;
-- Guests browse available items; org managers author the menu.
create policy venue_menu_item_select on public.venue_menu_item
  for select using (is_available = true or private.is_org_member(org_id));
create policy venue_menu_item_write on public.venue_menu_item
  for all using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']))
  with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create index if not exists idx_venue_menu_item_project on public.venue_menu_item (project_id);
create index if not exists idx_venue_menu_item_org on public.venue_menu_item (org_id);

-- ── Gamification: append-only points ledger ─────────────────────────────────
create table if not exists public.onsite_points (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  project_id  uuid references public.projects (id) on delete set null,
  reason      text not null check (reason in ('check_in','set_caught','friend_found','order_placed','share')),
  points      int  not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.onsite_points enable row level security;
-- A user reads their own ledger. Awards are server-controlled (the SECURITY
-- DEFINER RPC below), so there is intentionally NO direct insert policy — a
-- client can't mint its own points.
create policy onsite_points_select on public.onsite_points for select using (user_id = auth.uid());
create index if not exists idx_onsite_points_user on public.onsite_points (user_id);

-- Server-controlled award: fixed points per reason, attributed to the caller.
create or replace function public.award_onsite_points(p_reason text, p_project_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare pts int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  pts := case p_reason
    when 'check_in'     then 50
    when 'set_caught'   then 20
    when 'friend_found' then 15
    when 'order_placed' then 10
    when 'share'        then 5
    else 0 end;
  if pts = 0 then raise exception 'unknown reason: %', p_reason; end if;
  insert into public.onsite_points (user_id, project_id, reason, points)
  values (auth.uid(), p_project_id, p_reason, pts);
end $$;
revoke all on function public.award_onsite_points(text, uuid) from public;
grant execute on function public.award_onsite_points(text, uuid) to authenticated;

-- ── Scene ↔ event link (the scene "events" tab) ─────────────────────────────
create table if not exists public.scene_event (
  scene_id    uuid not null references public.scene (id) on delete cascade,
  project_id  uuid not null references public.projects (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (scene_id, project_id)
);
alter table public.scene_event enable row level security;
create policy scene_event_select on public.scene_event for select using (
  exists (select 1 from public.scene s where s.id = scene_id and (s.scene_state = 'published' or s.created_by = auth.uid())));
create policy scene_event_write on public.scene_event for all using (
  exists (select 1 from public.scene s where s.id = scene_id and s.created_by = auth.uid()))
  with check (exists (select 1 from public.scene s where s.id = scene_id and s.created_by = auth.uid()));
create index if not exists idx_scene_event_project on public.scene_event (project_id);
