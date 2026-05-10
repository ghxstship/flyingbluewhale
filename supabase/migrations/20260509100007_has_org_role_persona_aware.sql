-- Bug #13 / Workstream A1 — make `has_org_role` persona-aware so the
-- existing RLS policies (which already encode persona-tier names like
-- 'collaborator' and 'controller' in their required-role arrays) match
-- against the new memberships.persona column too. Non-breaking: the
-- original `role::text = any(required)` clause stays, so every existing
-- (owner/admin/manager/member)-based grant continues to work.
CREATE OR REPLACE FUNCTION private.has_org_role(target_org uuid, required text[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = (SELECT auth.uid())
      AND org_id = target_org
      AND (role::text = ANY(required) OR persona = ANY(required))
  );
$function$;
