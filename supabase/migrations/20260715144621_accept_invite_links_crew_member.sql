-- accept_invite — claim the operator-created crew record for the invitee.
--
-- THE GAP THIS CLOSES
-- ───────────────────
-- A crew_member is created two ways:
--   /me/crew            — self-service, so user_id = the session user.
--   /studio/people/crew — an operator types a name/email/role. user_id is
--                         NEVER set.
-- The second is how almost every crew record is born (live: 1 of 42 rows had a
-- user_id), and NOTHING ever connected "the record the operator typed" to "the
-- login that person later created". They stayed two unrelated rows forever.
--
-- Consequences, all live:
--   * role-derived capability grants could never reach anyone — the grant
--     resolver walks crew_members.user_id (ADR-0015),
--   * every crew_members.user_id lookup was dead.
--
-- WHY HERE, AND ONLY HERE
-- ───────────────────────
-- This is the one seam where the email is BOTH operator-asserted and
-- auth-verified: an admin explicitly invited that address, and the existing
-- check (`v_invite_email <> lower(v_user_email)` → invite_email_mismatch)
-- already proved the authenticated user owns it.
--
-- Linking on ANY signup with a matching email would be unsafe: an operator
-- typo'd address would hand that crew record — and its assignments,
-- credentials, and offer letters — to whoever registered it. The invite is the
-- operator's deliberate assertion that this address is this person.
--
-- Guards: org-scoped; `user_id is null` so a claimed record is never stolen
-- (verified against live rows: a second user accepting for an already-claimed
-- email does NOT take it); and `crew_members_org_email_idx` is
-- UNIQUE (org_id, lower(email)), so at most one row can ever match — the link
-- is unambiguous by construction.
--
-- Everything below is the pre-existing function verbatim EXCEPT the
-- `update public.crew_members ... set user_id` block, which is the new part.

CREATE OR REPLACE FUNCTION public.accept_invite(p_token text)
 RETURNS TABLE(out_org_id uuid, out_org_slug text, out_role platform_role, out_project_id uuid, out_project_role project_role)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Claim the operator-created crew record, if one is waiting for this email.
  -- Same transaction as the membership: a person cannot end up an org member
  -- with their crew record still orphaned.
  update public.crew_members
     set user_id = v_user_id,
         updated_at = now()
   where org_id = v_org_id
     and lower(email) = v_invite_email
     and user_id is null;

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

COMMENT ON FUNCTION public.accept_invite(text) IS
  'Validates an invite, upserts the membership + project membership, claims any unclaimed crew_members row matching the (operator-asserted, auth-verified) invite email, and flips the invite to accepted — atomically. The crew claim is why crew_members.user_id is ever populated for operator-created records; see ADR-0015.';
