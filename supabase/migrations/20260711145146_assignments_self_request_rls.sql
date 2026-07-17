-- D1-class (authorization) fix: the crew-facing advance-request intake is
-- blocked by assignments RLS — the same app-vs-RLS inversion class as the
-- 20260625145648 crew-grant sweep (time_entries/incidents), missed for
-- `assignments`.
--
-- The defect
-- ----------
-- /m/advances/new (COMPVSS kit `advance` FormScreen; also the One Front Door
-- "Gear & Advance" intake) calls requestAdvance (src/app/(mobile)/m/advances/
-- actions.ts): find-or-create a master_catalog_items SKU (policy
-- `master_catalog_items_org_rw` = is_org_member → succeeds for crew), then
-- INSERT the requester's own `assignments` row in fulfillment_state 'briefed'.
-- But `assignments_insert` WITH CHECK admits only the manager band
-- (owner/admin/manager/controller/collaborator) — no crew, and no self-request
-- branch — so the insert is refused and the request dies half-committed
-- (orphan catalog SKUs, zero assignments; observed live).
--
-- The fix: keep the manager band verbatim and add a narrowly-scoped
-- SELF-REQUEST branch instead of widening the band. A member may insert an
-- assignment only when it is their own request at the advance arc's entry
-- state: party is themselves, state is 'briefed', created_by is themselves.
-- This deliberately does NOT let a member self-issue entitlements (an
-- 'issued'/'redeemed' ticket or credential fails the branch) and does not
-- allow requesting on behalf of anyone else.

drop policy if exists assignments_insert on public.assignments;
create policy assignments_insert on public.assignments
  as permissive
  for insert
  to authenticated
  with check (
    private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])
    or (
      private.is_org_member(org_id)
      and party_kind = 'user'
      and party_user_id = (select auth.uid())
      and fulfillment_state = 'briefed'
      and created_by = (select auth.uid())
    )
  );
