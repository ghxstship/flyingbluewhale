-- Unified Assignment Domain — Security follow-up
-- Three views were created/recreated during 0061 + 0067 without explicit
-- security_invoker = true (PG default is security definer for legacy
-- views, which Supabase flags). Set them all to invoker so RLS applies
-- as the calling user, consistent with 0025_security_invoker_on_public_views.

ALTER VIEW public.v_xpms_atom_rollup SET (security_invoker = true);
ALTER VIEW public.v_xpms_atom_rollup_recursive SET (security_invoker = true);
ALTER VIEW public.notification_kind_catalog SET (security_invoker = true);
