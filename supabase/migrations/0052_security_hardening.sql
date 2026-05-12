-- ============================================================================
-- 0052_security_hardening.sql
-- ============================================================================
-- Closes the security lints introduced by migrations 0046-0051:
--
--   1. notification_kind_catalog view — created without SECURITY INVOKER,
--      flagged by lint 0010_security_definer_view. It is a static
--      reference view (no per-user data), so INVOKER is the correct
--      mode. Switching it makes anon reads honor the caller's RLS,
--      future-proofing against ever adding org-scoped columns.
--
--   2. tg_touch_updated_at, tg_guide_access_codes_touch_guide,
--      tg_bump_announcement_read_count — trigger functions missing
--      `SET search_path`. Lint 0011_function_search_path_mutable. We
--      pin to (public, pg_temp) so a malicious schema rename can't
--      hijack the trigger via search_path manipulation.
--
--   3. tg_fabrication_orders_phase_to_status — a trigger function
--      currently exposed as an RPC to anon + authenticated. Triggers
--      aren't meant to be RPC-callable; REVOKE EXECUTE.
--
-- All idempotent.
-- ============================================================================

-- 1. notification_kind_catalog → SECURITY INVOKER
do $$
begin
  if exists (select 1 from pg_views where schemaname = 'public' and viewname = 'notification_kind_catalog') then
    execute 'alter view public.notification_kind_catalog set (security_invoker = on)';
  end if;
end $$;

-- 2. Pin search_path on trigger functions
do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'tg_touch_updated_at'
  ) then
    execute 'alter function public.tg_touch_updated_at() set search_path = public, pg_temp';
  end if;

  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'tg_guide_access_codes_touch_guide'
  ) then
    execute 'alter function public.tg_guide_access_codes_touch_guide() set search_path = public, pg_temp';
  end if;

  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'tg_bump_announcement_read_count'
  ) then
    execute 'alter function public.tg_bump_announcement_read_count() set search_path = public, pg_temp';
  end if;
end $$;

-- 3. Revoke RPC execute on trigger-only function
do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'tg_fabrication_orders_phase_to_status'
  ) then
    execute 'revoke execute on function public.tg_fabrication_orders_phase_to_status() from anon, authenticated, public';
  end if;
end $$;
