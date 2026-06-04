-- ============================================================================
-- Project-scoped invites
-- ============================================================================
-- Extends the org-invite primitive to optionally grant project_members access
-- on accept. When `project_id IS NOT NULL`, accepting the invite both creates
-- the org membership (so RLS on org-scoped tables admits the user) AND inserts
-- a project_members row with the requested project_role.
--
-- Two columns on `invites`:
--   project_id    — when set, the invite is project-scoped. Null = org-only.
--   project_role  — the public.project_role to grant on that project. NOT
--                   nullable when project_id is set (enforced via CHECK).
--
-- The accept_invite RPC is updated in-place to honor the new columns. Project
-- members CRUD from the console uses direct SQL — the existing RLS already
-- permits `is_org_manager_plus` to insert/update/delete project_members rows.
-- The RPC pattern is only needed on the invitee side because the invitee is
-- not yet manager+ when they accept.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

alter table public.invites
  add column if not exists project_id   uuid references public.projects(id) on delete cascade,
  add column if not exists project_role public.project_role;

-- Cleanup any previous attempt's constraint before re-adding (idempotency).
alter table public.invites
  drop constraint if exists invites_project_role_when_project_id;

alter table public.invites
  add constraint invites_project_role_when_project_id
  check (
    (project_id is null and project_role is null)
    or (project_id is not null and project_role is not null)
  );

-- Index for the new "list pending invites for a project" lookup.
create index if not exists invites_project_id_pending_idx
  on public.invites (project_id, status)
  where project_id is not null;

comment on column public.invites.project_id is
  'Optional project scope. When set, accepting also inserts a project_members row.';
comment on column public.invites.project_role is
  'Required when project_id is set. The project_role to grant on accept.';

-- ── accept_invite v2 — honors project scope ────────────────────────────────
-- Same body as 0061, but additionally upserts project_members when the invite
-- carries a project_id. Returns now includes project_id + project_role so the
-- redirect logic can land an external invitee directly on /p/<slug>/<persona>.

drop function if exists public.accept_invite(text);

create or replace function public.accept_invite(p_token text)
returns table (
  out_org_id       uuid,
  out_org_slug     text,
  out_role         public.platform_role,
  out_project_id   uuid,
  out_project_role public.project_role
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_invite_id uuid;
  v_org_id uuid;
  v_org_slug text;
  v_role public.platform_role;
  v_invite_email text;
  v_project_id uuid;
  v_project_role public.project_role;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if p_token is null or length(p_token) < 8 then
    raise exception 'invalid_token' using errcode = '22023';
  end if;

  select email into v_user_email from auth.users where id = v_user_id;
  if v_user_email is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select i.id, i.org_id, i.role, lower(i.email), i.project_id, i.project_role
    into v_invite_id, v_org_id, v_role, v_invite_email, v_project_id, v_project_role
  from public.invites i
  where i.token = p_token
    and i.status = 'pending'
    and i.expires_at > now()
  for update;

  if v_invite_id is null then
    raise exception 'invite_invalid_or_expired' using errcode = '02000';
  end if;

  if v_invite_email <> lower(v_user_email) then
    raise exception 'invite_email_mismatch' using errcode = '42501';
  end if;

  -- Org membership (always — even project-scoped invites need this so RLS
  -- on org-scoped tables admits the user).
  insert into public.memberships (org_id, user_id, role, persona)
  values (v_org_id, v_user_id, v_role, v_role::text)
  on conflict (org_id, user_id) do update
    set role = excluded.role,
        persona = excluded.persona,
        deleted_at = null,
        updated_at = now();

  -- Project membership (only when invite was scoped).
  if v_project_id is not null then
    insert into public.project_members (project_id, user_id, role)
    values (v_project_id, v_user_id, v_project_role)
    on conflict (project_id, user_id) do update
      set role = excluded.role,
          updated_at = now();
  end if;

  update public.invites
     set status = 'accepted',
         accepted_at = now(),
         accepted_by = v_user_id
   where id = v_invite_id;

  begin
    insert into public.user_preferences (user_id, last_org_id)
    values (v_user_id, v_org_id)
    on conflict (user_id) do update set last_org_id = excluded.last_org_id;
  exception when undefined_table then
    null;
  end;

  select slug into v_org_slug from public.orgs where id = v_org_id;
  return query select v_org_id, v_org_slug, v_role, v_project_id, v_project_role;
end;
$$;

revoke all on function public.accept_invite(text) from public;
grant execute on function public.accept_invite(text) to authenticated;

comment on function public.accept_invite(text) is
  'Accept a pending invite by token. Inserts org membership + (if scoped) project_members. Returns scope so the caller can land the user on the right shell.';
