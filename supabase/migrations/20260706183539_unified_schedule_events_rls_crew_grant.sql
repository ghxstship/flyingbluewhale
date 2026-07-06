-- CP·4 / §5 — the crew persona edits its own availability / activity claims on
-- the unified schedule from /m, so the `events` schedule store write bands MUST
-- admit 'crew'. Same app-authorized-but-RLS-rejected inversion class fixed for
-- time_entries / incidents in the compvss-field crew grant: private.has_org_role
-- matches role::text OR persona, so a real crew member (role=member, persona=crew)
-- passes the app check but the DB rejected the write until 'crew' is in the band.
--
-- Canonical band: owner, admin, manager, controller, collaborator, crew.
-- DELETE stays the narrower owner/admin band by design (no crew hard-delete of
-- schedule rows). Guarded by src/lib/schedule-rls-crew-canon.test.ts.

begin;

drop policy if exists events_insert on public.events;
create policy events_insert on public.events
  as permissive for insert to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists events_update on public.events;
create policy events_update on public.events
  as permissive for update to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

commit;
