-- Revoke EXECUTE on SECURITY DEFINER helpers + offer-letter functions
-- Helpers (is_org_member, has_org_role, etc.) are RLS-only.
-- Offer-letter functions are now called via service-role client.

REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.has_org_role(uuid, text[]) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.has_org_role(uuid, text[]) TO service_role;
REVOKE EXECUTE ON FUNCTION public.auth_org_ids() FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.auth_org_ids() TO service_role;
REVOKE EXECUTE ON FUNCTION public.auth_user_email() FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.auth_user_email() TO service_role;
REVOKE EXECUTE ON FUNCTION public.proposal_org_id(uuid) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.proposal_org_id(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.accept_offer_letter(uuid, text, text, inet, text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.accept_offer_letter(uuid, text, text, inet, text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.decline_offer_letter(uuid, text, text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.decline_offer_letter(uuid, text, text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.get_offer_letter_by_token(uuid, text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.get_offer_letter_by_token(uuid, text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.get_offer_letter_project_name(uuid, text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.get_offer_letter_project_name(uuid, text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.record_offer_letter_view(uuid, text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.record_offer_letter_view(uuid, text) TO service_role;
