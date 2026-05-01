-- flyingbluewhale · Seaworthy final remediation (function-level)
--
-- Closes the function/permission flags from the Seaworthy audit.
-- Storage-policy and Supabase-Dashboard items are tracked in
-- docs/runbooks/seaworthy-ops.md (storage.objects can only be ALTERed
-- by the supabase_admin role, not via apply_migration).
--
-- Three groups of changes — all non-destructive:
--
--   1) Pin `search_path = public, pg_temp` on the eight functions
--      still flagged with mutable search_path. Defensive only.
--
--   2) Tighten EXECUTE on RLS-internal SECURITY DEFINER helpers:
--      revoke from PUBLIC (which both anon and authenticated inherit
--      by default), then explicitly grant back to authenticated. Net
--      effect: only authenticated users can RPC these — anon can't.
--      RLS policies that call them on behalf of authenticated callers
--      continue to work because authenticated retains EXECUTE.
--
--   3) Revoke EXECUTE from PUBLIC on trigger-only functions. These run
--      from Postgres trigger machinery using the trigger owner's
--      privileges; no caller ever needs to invoke them via REST. Net
--      effect: phantom REST endpoints (`/rpc/audit_trigger`,
--      `/rpc/handle_new_user`, etc.) become 401/403 for everyone.
--
-- We intentionally KEEP PUBLIC EXECUTE on the offer-letter token RPCs
-- (accept_offer_letter, decline_offer_letter, get_offer_letter_by_token,
-- get_offer_letter_project_name, record_offer_letter_view) — those are
-- the public offer-letter portal and require anon access by design.
-- They enforce token+code auth internally.

-- 1. Pin search_path on the eight remaining functions ----------------

alter function public.tg_check_vendor_compliance()
  set search_path = public, pg_temp;

alter function public.seed_salvage_city_ssot(p_org_slug text)
  set search_path = public, pg_temp;

alter function public.proposal_change_orders_number()
  set search_path = public, pg_temp;

alter function public.log_proposal_activity(
  p_proposal_id uuid, p_org_id uuid, p_kind text, p_actor_id uuid,
  p_actor_label text, p_target_kind text, p_target_id uuid,
  p_summary text, p_meta jsonb
) set search_path = public, pg_temp;

alter function public.seed_cornbread_abbey_road(p_org_slug text)
  set search_path = public, pg_temp;

alter function public.service_request_set_sla()
  set search_path = public, pg_temp;

alter function public.snapshot_offer_letter()
  set search_path = public, pg_temp;

alter function public.generate_offer_access_code()
  set search_path = public, pg_temp;

-- 2. RLS-internal helpers: revoke from PUBLIC, regrant to authenticated -

revoke execute on function public.is_org_member(uuid) from public;
revoke execute on function public.has_org_role(uuid, text[]) from public;
revoke execute on function public.auth_org_ids() from public;
revoke execute on function public.auth_user_email() from public;
revoke execute on function public.proposal_org_id(uuid) from public;

grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, text[]) to authenticated;
grant execute on function public.auth_org_ids() to authenticated;
grant execute on function public.auth_user_email() to authenticated;
grant execute on function public.proposal_org_id(uuid) to authenticated;

-- 3. Trigger-only functions: revoke from PUBLIC entirely (no regrant) --

revoke execute on function public.audit_trigger() from public;
revoke execute on function public.tg_audit_log() from public;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.emit_notification(
  uuid, uuid, text, text, text, text, jsonb
) from public;
