-- LEG3ND crews self-service membership (PERSONA_MATRIX S-2, L-P6d).
--
-- `legend_crew_members` writes were manager-banded (legend_crew_members_write,
-- last defined in 20260625144337_rls_manager_grant_sweep.sql), so the
-- /legend/crew surface could never offer join/leave to the learner — crews
-- were read-only for every non-manager. Add the learner self-service band,
-- mirroring the legend learner-write canon (is_org_member + self-id, see
-- src/lib/legend-learner-rls-canon.test.ts): any org member may join an
-- active crew as a plain 'member' and leave (delete) their own row. The
-- manager-band admin policy stays for roster curation (lead assignment,
-- removing others).
--
-- Read-only personas (viewer / client / community) are blocked app-side by
-- assertLegendWrite (src/lib/legend_access.ts) — RLS stays membership-banded
-- by design, consistent with the other learner writes.

create policy legend_crew_members_self_insert on public.legend_crew_members
  for insert
  with check (
    private.is_org_member(org_id)
    and user_id = (select auth.uid())
    and crew_role = 'member'
  );

create policy legend_crew_members_self_delete on public.legend_crew_members
  for delete
  using (
    private.is_org_member(org_id)
    and user_id = (select auth.uid())
  );
