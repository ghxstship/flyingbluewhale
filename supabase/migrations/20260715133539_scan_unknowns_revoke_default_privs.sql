-- Revoke what ALTER DEFAULT PRIVILEGES handed out implicitly.
--
-- pg_default_acl on schema public grants every NEW table `anon=r` and
-- `authenticated=arwd` before any explicit GRANT runs. So omitting a grant is
-- not a control — the privilege is already there. RLS is what actually keeps
-- anon out (is_org_member is false without a session), but this table has no
-- public surface at all, so the grant should not exist either.

REVOKE ALL ON TABLE "public"."scan_unknowns" FROM "anon";
REVOKE DELETE ON TABLE "public"."scan_unknowns" FROM "authenticated";
