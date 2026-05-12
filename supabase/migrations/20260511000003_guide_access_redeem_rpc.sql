-- ============================================================================
-- redeem_guide_access_code — anon-callable RPC for the unlock flow.
-- ============================================================================
-- The /api/v1/guides/unlock endpoint runs under the anon Supabase role
-- (portal callers, no service-role key in dev). RLS on guide_access_codes
-- only grants org-member read access; this SECURITY DEFINER routes the
-- read + bump + audit-insert through a single transaction so we can never
-- mint a cookie against an un-audited redemption.
--
-- OUT columns are prefixed with `out_*` to avoid PL/pgSQL name collisions
-- with the source table's columns (project_id, persona, etc.).
-- ============================================================================

drop function if exists public.redeem_guide_access_code(uuid, guide_persona, text, text, inet, text);

create function public.redeem_guide_access_code(
  p_project_id uuid,
  p_persona    guide_persona,
  p_code_hash  text,
  p_jti        text,
  p_ip         inet default null,
  p_user_agent text default null
)
returns table (
  ok_flag        boolean,
  reason_code    text,
  out_org_id     uuid,
  out_project_id uuid,
  out_persona    guide_persona,
  out_code_id    uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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

revoke all on function public.redeem_guide_access_code(uuid, guide_persona, text, text, inet, text) from public;
grant execute on function public.redeem_guide_access_code(uuid, guide_persona, text, text, inet, text) to anon, authenticated, service_role;
