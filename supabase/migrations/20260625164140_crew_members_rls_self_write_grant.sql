-- D1 RLS inversion fix (Phase-5 e2e sweep): the /me/crew self-managed crew
-- profile editor (upsertMyCrewAction) lets ANY org member write a crew_members
-- row keyed to their OWN user_id (it only requireSession()s). But the
-- crew_members write band gated purely on
--   has_org_role(org_id, ['owner','admin','manager','controller','collaborator'])
-- so a plain `member`/`community` persona (role=member) PASSED the app check
-- yet the DB rejected the INSERT/UPDATE with "new row violates row-level
-- security policy" — a self-service surface that literally couldn't save for
-- the very personas it's meant for. Masked in the demo/seed org because seeded
-- memberships carry persona='owner'.
--
-- Canonical fix (mirrors talent_profiles_update, which already admits
-- `OR user_id = auth.uid()`): additionally admit a user managing their OWN
-- crew profile (org-membership still required for the read band, so the row is
-- always inside an org the caller belongs to). The admin-managed roster band is
-- preserved unchanged — this only ADDS the self-write clause.

drop policy if exists crew_members_insert on public.crew_members;
create policy crew_members_insert on public.crew_members
  as permissive
  for insert
  to public
  with check (
    private.has_org_role(org_id, ARRAY['owner','admin','manager','controller','collaborator'])
    or user_id = (select auth.uid())
  );

drop policy if exists crew_members_update on public.crew_members;
create policy crew_members_update on public.crew_members
  as permissive
  for update
  to public
  using (
    private.has_org_role(org_id, ARRAY['owner','admin','manager','controller','collaborator'])
    or user_id = (select auth.uid())
  )
  with check (
    private.has_org_role(org_id, ARRAY['owner','admin','manager','controller','collaborator'])
    or user_id = (select auth.uid())
  );
