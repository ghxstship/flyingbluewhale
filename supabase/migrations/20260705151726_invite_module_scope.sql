-- Kit 21 wave W4 — scope-gated subcontractor access. A module allow-list
-- carried from invite → membership. NULL = full access (every existing row
-- keeps its behavior); a non-null array narrows the console rail to the named
-- nav-group modules (UI allow-list, additive to the org-membership RLS every
-- surface already enforces). module_scope holds NavGroup labels
-- (e.g. {Finance,Procurement}); expiry rides the invites.expires_at already
-- present, mirrored onto memberships.access_expires_at so a scoped seat can
-- lapse. Applied to the live project 2026-07-05 via the Supabase MCP;
-- committed here for repo/migration parity.

alter table public.invites
  add column if not exists module_scope text[];

alter table public.memberships
  add column if not exists module_scope        text[],
  add column if not exists access_expires_at   timestamptz;

-- Carry module_scope + expiry through acceptance. Additive + null-safe: the
-- only change vs. the prior body is the two new columns in the membership
-- upsert, sourced from the invite (null when the invite didn't set them).
create or replace function public.accept_invite(p_token text)
 returns table(out_org_id uuid, out_org_slug text, out_role platform_role, out_project_id uuid, out_project_role project_role)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
#variable_conflict use_column
declare
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_invite_id uuid;
  v_org_id uuid;
  v_org_slug text;
  v_role public.platform_role;
  v_persona text;
  v_invite_email text;
  v_project_id uuid;
  v_project_role public.project_role;
  v_module_scope text[];
  v_expires_at timestamptz;
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

  select i.id, i.org_id, i.role, i.persona, lower(i.email), i.project_id, i.project_role, i.module_scope, i.expires_at
    into v_invite_id, v_org_id, v_role, v_persona, v_invite_email, v_project_id, v_project_role, v_module_scope, v_expires_at
  from public.invites i
  where i.token = p_token
    and i.invite_state = 'pending'
    and i.expires_at > now()
  for update;

  if v_invite_id is null then
    raise exception 'invite_invalid_or_expired' using errcode = '02000';
  end if;

  if v_invite_email <> lower(v_user_email) then
    raise exception 'invite_email_mismatch' using errcode = '42501';
  end if;

  insert into public.memberships (org_id, user_id, role, persona, module_scope, access_expires_at)
  values (v_org_id, v_user_id, v_role, coalesce(v_persona, v_role::text), v_module_scope,
          case when v_module_scope is not null then v_expires_at else null end)
  on conflict (org_id, user_id) do update
    set role = excluded.role,
        persona = excluded.persona,
        module_scope = excluded.module_scope,
        access_expires_at = excluded.access_expires_at,
        deleted_at = null,
        updated_at = now();

  if v_project_id is not null then
    insert into public.project_members (project_id, user_id, role)
    values (v_project_id, v_user_id, v_project_role)
    on conflict (project_id, user_id) do update
      set role = excluded.role,
          updated_at = now();
  end if;

  update public.invites
     set invite_state = 'accepted',
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
$function$;
