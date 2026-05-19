-- Guide access redeem RPC v2 — idempotent re-deploy after GRANT order fix.
-- Identical logic to v1; re-applies CREATE OR REPLACE to ensure the GRANT
-- on the anon role is in effect after any privilege resets.

CREATE OR REPLACE FUNCTION public.redeem_guide_access_code(
  p_project_id uuid,
  p_persona    guide_persona,
  p_code_hash  text,
  p_jti        text,
  p_ip         inet default null,
  p_user_agent text default null
)
RETURNS TABLE (
  ok_flag        boolean,
  reason_code    text,
  out_org_id     uuid,
  out_project_id uuid,
  out_persona    guide_persona,
  out_code_id    uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
declare
  v_row guide_access_codes%rowtype;
begin
  select * into v_row
    from guide_access_codes c
   where c.project_id = p_project_id
     and c.persona    = p_persona
     and c.code_hash  = p_code_hash
   limit 1;

  if not found then
    return query select false, 'not_found'::text, null::uuid, null::uuid, null::guide_persona, null::uuid;
    return;
  end if;

  if v_row.revoked_at is not null then
    return query select false, 'revoked'::text, null::uuid, null::uuid, null::guide_persona, null::uuid;
    return;
  end if;

  if v_row.expires_at is not null and v_row.expires_at < now() then
    return query select false, 'expired'::text, null::uuid, null::uuid, null::guide_persona, null::uuid;
    return;
  end if;

  if v_row.max_uses is not null and v_row.use_count >= v_row.max_uses then
    return query select false, 'exhausted'::text, null::uuid, null::uuid, null::guide_persona, null::uuid;
    return;
  end if;

  update guide_access_codes
     set use_count    = use_count + 1,
         last_used_at = now()
   where id = v_row.id;

  insert into guide_access_redemptions (code_id, project_id, persona, cookie_jti, ip, user_agent)
  values (v_row.id, v_row.project_id, v_row.persona, p_jti, p_ip, p_user_agent);

  return query select true, null::text, v_row.org_id, v_row.project_id, v_row.persona, v_row.id;
end;
$$;

REVOKE ALL ON FUNCTION public.redeem_guide_access_code(uuid, guide_persona, text, text, inet, text) FROM public;
GRANT EXECUTE ON FUNCTION public.redeem_guide_access_code(uuid, guide_persona, text, text, inet, text) TO anon, authenticated, service_role;
