-- D1-class (authorization) fix: COMPVSS field write surfaces omit the `crew`
-- role/persona from their RLS bands — the SAME app-vs-RLS inversion class as
-- the proposal/tasks/manager-grant sweeps, but for the `crew` (deskless field
-- workforce) persona instead of `manager`.
--
-- The defect
-- ----------
-- /m (COMPVSS field PWA) is the crew's OWN-record workspace. Its core daily
-- surfaces write on the RLS-enforced user client:
--   · /m/clock     → time_entries INSERT (clock in) + UPDATE (clock out)
--   · /m/incident  → incidents (My Incidents lifecycle)
-- requireSession admits ANY org member (crew included), and resolveShell lands
-- the `crew` persona squarely in /m. Yet the write bands on these tables were
--   ['owner','admin','manager','controller','collaborator']
-- — `crew` is absent. has_org_role matches role::text OR persona, so a real
-- crew member (role=member, persona=crew) FAILS the INSERT/UPDATE at the DB
-- with "new row violates row-level security policy": a crew member literally
-- cannot punch the clock. Masked in the demo org (seeded persona='owner').
--
-- daily_logs / time_off_requests / shift_notes already admit crew (daily_logs
-- band lists 'crew'; the time-off + shift-note bands use is_org_member, which
-- any member — crew included — satisfies). Only the three policies below are
-- the offending inversions for the crew persona.
--
-- The fix: recreate each VERBATIM with 'crew'::text appended to the band
-- (canonical order: owner, admin, manager, controller, collaborator, crew).
-- Every other predicate (TO role, USING vs WITH CHECK) is preserved exactly.
--
-- Guarded against regression by src/lib/compvss-field-rls-crew-canon.test.ts.

-- time_entries: clock IN
drop policy if exists time_entries_insert on public.time_entries;
create policy time_entries_insert on public.time_entries
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

-- time_entries: clock OUT
drop policy if exists time_entries_update on public.time_entries;
create policy time_entries_update on public.time_entries
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

-- incidents: My Incidents lifecycle (insert already passes via is_org_member;
-- update band omitted crew, blocking the crew's own incident follow-ups).
drop policy if exists incidents_update on public.incidents;
create policy incidents_update on public.incidents
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));
