-- Brand sweep: remove repo-nickname references from live schema objects.
--
-- 1. orgs.logo_url comment referenced "flyingbluewhale wordmark" — the repo
--    nickname must not appear in any user-visible identifier or copy per the
--    ATLVS brand canon in CLAUDE.md.
-- 2. Any test-fixture users seeded via the legacy flyingbluewhale.app email
--    domain are updated to atlvs.pro so the seed-test-fixtures function and
--    the membership persona backfill in 0028 stay consistent with the new
--    domain the function now writes.

COMMENT ON COLUMN "public"."orgs"."logo_url" IS 'https URL to org logo; replaces the platform wordmark inside the tenant shell.';

-- Update any test users whose email domain was set by legacy seed tooling.
-- This is a safe no-op when no such users exist.
UPDATE auth.users
SET email = replace(email, '@flyingbluewhale.app', '@atlvs.pro')
WHERE email LIKE '%@flyingbluewhale.app';
