-- Restore SELECT for org members on 4 marketplace-canon tables.
-- Same regression as talent_offers (migration 20260510000004): the
-- consolidation in 20260509100012 split FOR ALL into FOR INSERT/UPDATE/
-- DELETE without emitting the SELECT case, so org members lost the
-- ability to read their own org's draft/private rows. Each table kept
-- its public-read policy (status=published / is_public=true / etc.)
-- which is fine for anon/marketplace surfaces but doesn't cover
-- console use cases where the org needs to manage rows in any state.
--
-- Symptoms:
-- - "create posting → land on detail → publish → close" (job_postings)
-- - "create open call → publish → see in /marketplace/calls (anon)" (open_calls)
-- All fail because the post-insert redirect can't load the row it
-- just wrote (RLS blocks the SELECT until the row is "public").

drop policy if exists job_postings_org_select on public.job_postings;
create policy job_postings_org_select on public.job_postings
  for select using (private.is_org_member(org_id));

drop policy if exists open_calls_org_select on public.open_calls;
create policy open_calls_org_select on public.open_calls
  for select using (private.is_org_member(org_id));

drop policy if exists agencies_org_select on public.agencies;
create policy agencies_org_select on public.agencies
  for select using (private.is_org_member(org_id));

drop policy if exists event_milestones_org_select on public.event_milestones;
create policy event_milestones_org_select on public.event_milestones
  for select using (private.is_org_member(org_id));

comment on policy job_postings_org_select on public.job_postings is
  'Org members read all of their org''s job_postings (any state). '
  'Companion to job_postings_public_select (status=published).';
comment on policy open_calls_org_select on public.open_calls is
  'Org members read all of their org''s open_calls (any state). '
  'Companion to open_calls_public_select (status=published).';
comment on policy agencies_org_select on public.agencies is
  'Org members read all of their org''s agencies. Companion to '
  'agencies_public_select (is_public=true).';
comment on policy event_milestones_org_select on public.event_milestones is
  'Org members read all of their org''s event_milestones (any '
  'visibility). Companion to event_milestones_public_select.';
