-- Bug #13 / Workstream A1 — persona granularity beyond PlatformRole.
--
-- The 4-value PlatformRole (owner/admin/manager/member) is too coarse for
-- the marketplace personas (crew/client/viewer/community/contractor/
-- collaborator). All non-internal personas previously collapsed to
-- "member" and inherited member capabilities — which let crew do client
-- things and clients do crew things. The capability-gating spec assumed
-- granularity that didn't exist.
--
-- This adds a `persona` column to memberships. Production callers populate
-- it via invite/accept flow; for the seeded test users we backfill from
-- the email pattern `test+<persona>@…`.

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS persona text;

-- Backfill 1: explicit personas from the test-user email convention.
UPDATE public.memberships m
SET persona = split_part(split_part(u.email, '+', 2), '@', 1)
FROM auth.users u
WHERE m.user_id = u.id
  AND m.persona IS NULL
  AND u.email LIKE 'test+%@atlvs.pro'
  AND split_part(split_part(u.email, '+', 2), '@', 1) IN (
    'owner','admin','manager','member','collaborator','contractor','crew',
    'client','viewer','community','controller','developer'
  );

-- Backfill 2: harmonize aliases. `controller` is the test alias for the
-- `manager` platform-role persona; `developer` is admin tier.
UPDATE public.memberships SET persona = 'manager' WHERE persona = 'controller';
UPDATE public.memberships SET persona = 'admin'   WHERE persona = 'developer';

-- Backfill 3: any row still null (real users, non-test seed data) gets
-- persona = role so the existing behaviour is preserved bit-for-bit.
UPDATE public.memberships SET persona = role WHERE persona IS NULL;

-- Lock the value space + make non-null + default for new rows.
ALTER TABLE public.memberships
  ADD CONSTRAINT memberships_persona_check
  CHECK (persona IN (
    'owner','admin','manager','member',
    'collaborator','contractor','crew','client','viewer','community','guest'
  ));
ALTER TABLE public.memberships ALTER COLUMN persona SET NOT NULL;
ALTER TABLE public.memberships ALTER COLUMN persona SET DEFAULT 'member';
