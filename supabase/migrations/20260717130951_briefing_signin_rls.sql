-- Briefing sign-in: close the attendance-spoof channel.
--
-- APPLIED 2026-07-17 (ship pass) as 20260717130951 after review — matches the
--   ADR-0008 Am.7 identity-boundary pattern. The console tightening below is
--   a deliberate behaviour change for member-role operators; nothing REQUIRES
--   this migration; both flows work under the live policies. What it changes
--   is who ELSE can write these rows.
--
-- ── The finding ──────────────────────────────────────────────────────────
--
-- `safety_briefing_attendees` is a safety compliance record — "this person
-- was in the room and signed". Its live write policies are org-member-wide
-- on every verb (baseline `briefing_att_write__{insert,update,delete}`):
--
--   * any org member can INSERT an attendance row carrying ANY user_id —
--     i.e. sign a colleague in to a talk they never attended;
--   * any org member can UPDATE anyone's row — retro-stamp acknowledged_at
--     or swap signature_path on a peer's signed record;
--   * any org member can DELETE any attendance row.
--
-- The mobile sign-in action binds user_id to the session server-side, but
-- an action is a convention, not a boundary (identity sweep ADR-0008 Am.7:
-- "does RLS agree?" — here it does not). Proxy-signing by hand is exactly
-- the practice briefing.signin exists to end; the store should refuse it
-- from non-managers, not merely not-offer it.
--
-- ── The shape ────────────────────────────────────────────────────────────
--
-- READ stays org-member (attendance is a site-wide safety roll, and the
-- consolidated select policy from 20260625 already says so). Writes split
-- three ways:
--
--   self        a member may insert/update the row that IS them
--               (user_id = auth.uid());
--   roster      crew_member_id rows (user_id IS NULL) have no auth identity
--               to spoof-check — they are inherently proxy captures
--               ("pass the phone", console seeding). Any org member may
--               write them, which keeps the deliverer flow working from a
--               member-role device;
--   manager+    the manager band keeps full write, including other users'
--               rows (the console's proxy-sign + remove controls).
--
-- WITH CHECK carries the same predicate so an UPDATE cannot re-point a row
-- at a different user_id than the writer is entitled to.
--
-- Console impact if applied: a member-role console operator loses
-- add/acknowledge/remove on OTHER USERS' attendee rows (crew-roster rows
-- keep working). The manager band — who runs /studio/safety in practice —
-- is unaffected.

-- The band mirrors 20260625144337_rls_manager_grant_sweep's manager band.

drop policy if exists briefing_att_write__insert on public.safety_briefing_attendees;
create policy briefing_att_write__insert on public.safety_briefing_attendees
  as permissive
  for insert
  to authenticated
  with check (
    private.is_org_member(org_id)
    and (
      user_id = (select auth.uid())
      or user_id is null
      or private.has_org_role(org_id, array['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])
    )
  );

drop policy if exists briefing_att_write__update on public.safety_briefing_attendees;
create policy briefing_att_write__update on public.safety_briefing_attendees
  as permissive
  for update
  to authenticated
  using (
    private.is_org_member(org_id)
    and (
      user_id = (select auth.uid())
      or user_id is null
      or private.has_org_role(org_id, array['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])
    )
  )
  with check (
    private.is_org_member(org_id)
    and (
      user_id = (select auth.uid())
      or user_id is null
      or private.has_org_role(org_id, array['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])
    )
  );

drop policy if exists briefing_att_write__delete on public.safety_briefing_attendees;
create policy briefing_att_write__delete on public.safety_briefing_attendees
  as permissive
  for delete
  to authenticated
  using (
    private.has_org_role(org_id, array['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])
  );
