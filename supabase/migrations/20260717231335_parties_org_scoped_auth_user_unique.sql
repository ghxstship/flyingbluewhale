-- parties_auth_user was UNIQUE (auth_user_id) GLOBALLY (baseline-era), which
-- contradicts the org-scoped party canon (src/lib/db/parties.ts): a person is
-- a party PER ORG, and every resolver/read is (org_id, auth_user_id) keyed.
-- The global index meant a user could hold a party in only ONE org across all
-- tenants — ensurePartyForMember's insert for a member who already had a
-- party in another org failed, and callers surfaced the null as "not a member
-- of this workspace" (found by the 2026-07-17 prod e2e: test+owner's party in
-- Test Portal Org blocked their party in Test Professional Org).
--
-- Replacement: unique per (org_id, auth_user_id), live rows only — exactly the
-- key every resolver reads. An archived party no longer blocks a fresh one.
drop index if exists public.parties_auth_user;
create unique index parties_org_auth_user
  on public.parties (org_id, auth_user_id)
  where auth_user_id is not null and deleted_at is null;
