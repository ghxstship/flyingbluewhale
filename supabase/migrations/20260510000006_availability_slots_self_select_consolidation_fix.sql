-- Restore SELECT for the slot owner on availability_slots. Same
-- consolidation regression as talent_offers + the marketplace-canon
-- batch: the FOR ALL `availability_slots_self_rw` policy was split
-- into self_insert/update/delete but the SELECT case was lost. The
-- remaining SELECT (availability_slots_org_select) requires
-- org_id IS NOT NULL, which excludes personal /me/availability slots
-- where the user creates org_id-less holds.
--
-- Symptom: "/me/availability add + delete slot" e2e test creates a
-- slot, then can't see it on the page (it's there in the DB but the
-- slot owner can't read their own row back).

drop policy if exists availability_slots_self_select on public.availability_slots;
create policy availability_slots_self_select on public.availability_slots
  for select using (user_id = (select auth.uid()));

comment on policy availability_slots_self_select on public.availability_slots is
  'Slot owner reads their own holds (org-scoped or personal). '
  'Companion to availability_slots_org_select (org members read '
  'org-scoped slots) — both needed because /me/availability creates '
  'org_id-NULL slots that the org_select policy excludes.';
