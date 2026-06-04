-- ============================================================================
-- RLS helpers: filter soft-deleted memberships
-- ============================================================================
-- The five canonical helpers used by every RLS policy in this database
-- previously matched a row whether or not the membership had been soft-
-- deleted. The intent (per `removePerson`) was that soft-deleting a
-- membership instantly revokes that user's access — and the session
-- helpers (getSession + verifyApiKey) DO filter `deleted_at`. But the
-- RLS layer did not, so a recently-offboarded user with an unrefreshed
-- cookie could still pass every policy check until the cookie cycled.
--
-- Five helpers updated, all gain `AND m.deleted_at IS NULL`:
--   private.is_org_member(target_org)
--   private.is_org_manager_plus(target_org)
--   private.has_org_role(target_org, required[])
--   private.is_project_member(target_project)
--   private.has_project_role(target_project, required[])
--
-- Side effect: `/api/v1/me/restore` can no longer update its own
-- memberships via the session client (the user is soft-deleted at the
-- point of restore). The restore route is switched to `createServiceClient`
-- in the same change-set so the anti-bricking flow keeps working.
-- Same for `/api/v1/me/delete`'s memberships sweep.
-- ============================================================================

-- ── private.is_org_member ──────────────────────────────────────────────────
create or replace function private.is_org_member(target_org uuid)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  match boolean;
begin
  select exists (
    select 1 from memberships
    where user_id = (select auth.uid())
      and org_id = target_org
      and deleted_at is null
  ) into match;
  return match;
end;
$$;

-- ── private.is_org_manager_plus ────────────────────────────────────────────
create or replace function private.is_org_manager_plus(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from memberships
    where user_id = (select auth.uid())
      and org_id = target_org
      and deleted_at is null
      and role in ('owner','admin','manager')
  );
$$;

-- ── private.has_org_role ───────────────────────────────────────────────────
create or replace function private.has_org_role(target_org uuid, required text[])
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from memberships
    where user_id = (select auth.uid())
      and org_id = target_org
      and deleted_at is null
      and (role::text = any(required) or persona = any(required))
  );
$$;

-- ── private.is_project_member ──────────────────────────────────────────────
create or replace function private.is_project_member(target_project uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from project_members
    where project_id = target_project
      and user_id = (select auth.uid())
  )
  or exists (
    select 1 from projects p
    join memberships m on m.org_id = p.org_id
    where p.id = target_project
      and m.user_id = (select auth.uid())
      and m.deleted_at is null
      and m.role in ('owner','admin','manager')
  );
$$;

-- ── private.has_project_role ───────────────────────────────────────────────
create or replace function private.has_project_role(target_project uuid, required text[])
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from project_members
    where project_id = target_project
      and user_id = (select auth.uid())
      and role::text = any(required)
  )
  or exists (
    select 1 from projects p
    join memberships m on m.org_id = p.org_id
    where p.id = target_project
      and m.user_id = (select auth.uid())
      and m.deleted_at is null
      and m.role in ('owner','admin','manager')
  );
$$;

comment on function private.is_org_member(uuid) is
  'TRUE if caller has an active (deleted_at IS NULL) membership in target_org.';
comment on function private.is_org_manager_plus(uuid) is
  'TRUE if caller has an active owner/admin/manager membership in target_org.';
comment on function private.has_org_role(uuid, text[]) is
  'TRUE if caller has an active membership with one of `required` (matches against role OR persona).';
comment on function private.is_project_member(uuid) is
  'TRUE if caller is a project_member of target_project OR an active org_manager_plus of its org.';
comment on function private.has_project_role(uuid, text[]) is
  'TRUE if caller has one of `required` on target_project OR is an active org_manager_plus of its org.';
