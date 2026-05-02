-- Restore EXECUTE on RLS helpers (was wrongly revoked in round 8f).
-- Helpers must be callable from RLS USING clauses, which evaluate as the
-- API caller's role. Revoking EXECUTE caused all RLS to silently return
-- empty result sets to authenticated users.
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_org_role(uuid, text[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_org_ids() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_email() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.proposal_org_id(uuid) TO anon, authenticated;
