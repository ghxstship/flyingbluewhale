-- flyingbluewhale · dev seed (idempotent)
-- Requires service role; run after signing up a real user and grabbing their auth.users.id.

-- NOTE: seeding via SQL with auth integrations is awkward — prefer `scripts/seed.ts`
-- Kept here as a reference. Leave commented out.

-- insert into orgs (id, slug, name, tier) values
--   ('00000000-0000-4000-a000-000000000001', 'demo', 'Demo Events Co.', 'professional')
--   on conflict (slug) do nothing;
