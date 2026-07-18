-- Kit 30 manual-position seam: the assign flow is manager-gated
-- (people:manage sits on the manager floor), but org_roles writes are
-- owner/admin-band RLS — so ensureCustomPositionRole's lazy insert of the
-- ONE per-org system row crashed the roster page for managers ("new row
-- violates row-level security policy for table org_roles", prod digest
-- 2271834327, found by the jack-sparrow acceptance).
--
-- Narrow SECURITY DEFINER get-or-create, the approve_time_off_request
-- precedent: manager-band callers may materialize exactly this system row —
-- slug/label/is_system are hardcoded, so this grants NO authority over the
-- position catalog itself (authoring stays admin-band).
create or replace function public.ensure_custom_position_role(p_org_id uuid)
  returns uuid language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if not private.has_org_role(p_org_id, array['owner', 'admin', 'manager']) then
    raise exception 'Only managers can assign manual positions' using errcode = '42501';
  end if;

  insert into public.org_roles (org_id, slug, label, is_system)
  values (p_org_id, 'custom-position', 'Custom Position', true)
  on conflict (org_id, slug) do nothing;

  select id into v_id from public.org_roles
   where org_id = p_org_id and slug = 'custom-position';
  return v_id;
end;
$$;

revoke all on function public.ensure_custom_position_role(uuid) from public, anon;
grant execute on function public.ensure_custom_position_role(uuid) to authenticated;
