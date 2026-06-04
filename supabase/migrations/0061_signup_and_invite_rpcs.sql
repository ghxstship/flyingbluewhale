-- ============================================================================
-- Signup + invite acceptance RPCs
-- ============================================================================
-- Two SECURITY DEFINER RPCs that close the auth/onboarding loop:
--
--   create_org_with_owner(name, slug)
--     The signup form (and /onboarding/org) calls this to bootstrap a brand
--     new workspace for the signed-in user. RLS on `orgs` has no INSERT
--     policy at all (orgs are admin-created elsewhere historically), so a
--     direct INSERT from the user's session fails. This RPC owns the
--     two-write transaction (orgs row + owner membership) and returns the
--     fresh org id + slug so the action can redirect cleanly.
--
--   accept_invite(token)
--     The invite-accept page calls this. The previous direct upsert from
--     the invitee's session hits `memberships_insert_admin` and fails
--     because the invitee isn't yet an admin of the org they're joining.
--     This RPC validates the token (matching email + pending + unexpired),
--     restores any soft-deleted prior membership, upserts the new one with
--     the role from the invite, and marks the invite accepted — all under
--     a single SECURITY DEFINER fence so RLS doesn't strand the join half-
--     way through.
--
-- Both RPCs are revoked from PUBLIC and granted to `authenticated` only.
-- Idempotent. Safe to re-run.
-- ============================================================================

-- ── 1. create_org_with_owner ────────────────────────────────────────────────

create or replace function public.create_org_with_owner(
  p_name text,
  p_slug text
)
returns table (org_id uuid, org_slug text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_slug text;
  v_org_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  -- Trim + collapse whitespace; reject empty.
  p_name := btrim(coalesce(p_name, ''));
  if length(p_name) = 0 then
    raise exception 'name_required' using errcode = '22023';
  end if;
  if length(p_name) > 120 then
    raise exception 'name_too_long' using errcode = '22023';
  end if;

  -- Normalize / generate a slug. If caller supplied one, sanitize. Otherwise
  -- derive from the name. Suffix with a short random tail on collision so
  -- "Acme" → "acme", second "Acme" → "acme-q4r2", etc.
  v_slug := lower(coalesce(nullif(btrim(p_slug), ''), p_name));
  v_slug := regexp_replace(v_slug, '[^a-z0-9]+', '-', 'g');
  v_slug := btrim(v_slug, '-');
  v_slug := substring(v_slug from 1 for 48);
  if length(v_slug) = 0 then
    v_slug := 'org';
  end if;

  -- Collision-loop. Cap at 5 attempts; the random tail makes collisions
  -- vanishingly unlikely past the first.
  for i in 1..5 loop
    begin
      insert into public.orgs (slug, name, tier)
      values (v_slug, p_name, 'access')
      returning id into v_org_id;
      exit;
    exception when unique_violation then
      v_slug := substring(v_slug from 1 for 40) || '-' ||
                lower(substring(encode(extensions.gen_random_bytes(3), 'base64'), 1, 4));
      v_slug := regexp_replace(v_slug, '[^a-z0-9-]+', '', 'g');
    end;
  end loop;

  if v_org_id is null then
    raise exception 'slug_collision_exhausted' using errcode = '23505';
  end if;

  -- Owner membership. Persona='owner' so /auth/resolve routes to /console.
  insert into public.memberships (org_id, user_id, role, persona)
  values (v_org_id, v_user_id, 'owner', 'owner');

  -- Sticky workspace switcher: make this the user's last_org_id so the
  -- next session lands on it immediately.
  select email into v_user_email from auth.users where id = v_user_id;

  begin
    insert into public.user_preferences (user_id, last_org_id)
    values (v_user_id, v_org_id)
    on conflict (user_id) do update set last_org_id = excluded.last_org_id;
  exception when undefined_table then
    -- user_preferences may be absent in legacy environments; ignore.
    null;
  end;

  return query select v_org_id, v_slug;
end;
$$;

revoke all on function public.create_org_with_owner(text, text) from public;
grant execute on function public.create_org_with_owner(text, text) to authenticated;

comment on function public.create_org_with_owner(text, text) is
  'Bootstrap a new org with the calling user as owner. Used by /signup and /onboarding/org. Returns (org_id, org_slug).';


-- ── 2. accept_invite ────────────────────────────────────────────────────────

-- NOTE: OUT columns are prefixed `out_` so they don't shadow column references
-- inside the body. PL/pgSQL otherwise resolves `org_id` in `ON CONFLICT (org_id,
-- user_id)` to the RETURNS TABLE column and the planner can't reach the
-- constraint — `ERROR: column reference "org_id" is ambiguous`.
-- `#variable_conflict use_column` is a belt-and-braces guard.

drop function if exists public.accept_invite(text);

create or replace function public.accept_invite(p_token text)
returns table (out_org_id uuid, out_org_slug text, out_role public.platform_role)
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

  -- Validate invite. Lock the row so two concurrent accepts can't both
  -- mark the same invite accepted.
  select i.id, i.org_id, i.role, lower(i.email)
    into v_invite_id, v_org_id, v_role, v_invite_email
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

  -- Upsert membership with deleted_at:=null to restore re-invited users.
  -- Role from the invite always wins on re-invite (an admin re-invited
  -- them as 'manager' → that's what they get, even if a stale
  -- soft-deleted row had 'member').
  insert into public.memberships (org_id, user_id, role, persona)
  values (v_org_id, v_user_id, v_role, v_role::text)
  on conflict (org_id, user_id) do update
    set role = excluded.role,
        persona = excluded.persona,
        deleted_at = null,
        updated_at = now();

  -- Mark the invite accepted.
  update public.invites
     set status = 'accepted',
         accepted_at = now(),
         accepted_by = v_user_id
   where id = v_invite_id;

  -- Sticky workspace: route the user's next session to this org.
  begin
    insert into public.user_preferences (user_id, last_org_id)
    values (v_user_id, v_org_id)
    on conflict (user_id) do update set last_org_id = excluded.last_org_id;
  exception when undefined_table then
    null;
  end;

  select slug into v_org_slug from public.orgs where id = v_org_id;
  return query select v_org_id, v_org_slug, v_role;
end;
$$;

revoke all on function public.accept_invite(text) from public;
grant execute on function public.accept_invite(text) to authenticated;

comment on function public.accept_invite(text) is
  'Accept a pending invite by token. Validates email match, upserts membership (restoring soft-deleted rows), marks invite accepted. Returns (org_id, org_slug, role).';
