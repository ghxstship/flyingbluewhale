-- Final pass on multiple-permissive-policy consolidation: merge the
-- org_* + self_* (and for reviews/talent_profiles, public_*) policies
-- into a single FOR <cmd> policy per action with a combined OR check.
--
-- Why we previously kept them split: easier to reason about each access
-- path independently, and each is gated by a DIFFERENT predicate
-- (org membership vs self-ownership vs released_at). But Postgres
-- evaluates each PERMISSIVE policy separately and OR's the results, so
-- two separate policies with USING (a) and USING (b) are semantically
-- IDENTICAL to one policy with USING (a OR b) — only the function-call
-- count differs. Collapsing halves the per-row policy work.
--
-- Result: each of the 4 marketplace tables now has exactly 1 policy
-- per action (S/I/U/D = 4 policies total, not 8). Closes the last 32
-- multiple_permissive_policies advisor lints.

-- ───────── job_applications ─────────
drop policy if exists job_applications_org_select on public.job_applications;
drop policy if exists job_applications_self_select on public.job_applications;
drop policy if exists job_applications_org_insert on public.job_applications;
drop policy if exists job_applications_self_insert on public.job_applications;
drop policy if exists job_applications_org_update on public.job_applications;
drop policy if exists job_applications_self_update on public.job_applications;
drop policy if exists job_applications_org_delete on public.job_applications;

create policy job_applications_select on public.job_applications
  for select using (private.is_org_member(org_id) or applicant_user_id = (select auth.uid()));
create policy job_applications_insert on public.job_applications
  for insert with check (private.is_org_member(org_id) or applicant_user_id = (select auth.uid()));
create policy job_applications_update on public.job_applications
  for update
  using (private.is_org_member(org_id) or applicant_user_id = (select auth.uid()))
  with check (private.is_org_member(org_id) or applicant_user_id = (select auth.uid()));
create policy job_applications_delete on public.job_applications
  for delete using (private.is_org_member(org_id));

-- ───────── open_call_submissions ─────────
drop policy if exists open_call_submissions_org_select on public.open_call_submissions;
drop policy if exists open_call_submissions_self_select on public.open_call_submissions;
drop policy if exists open_call_submissions_org_insert on public.open_call_submissions;
drop policy if exists open_call_submissions_self_insert on public.open_call_submissions;
drop policy if exists open_call_submissions_org_update on public.open_call_submissions;
drop policy if exists open_call_submissions_org_delete on public.open_call_submissions;

create policy open_call_submissions_select on public.open_call_submissions
  for select using (private.is_org_member(org_id) or submitter_user_id = (select auth.uid()));
create policy open_call_submissions_insert on public.open_call_submissions
  for insert with check (private.is_org_member(org_id) or submitter_user_id = (select auth.uid()));
create policy open_call_submissions_update on public.open_call_submissions
  for update
  using (private.is_org_member(org_id))
  with check (private.is_org_member(org_id));
create policy open_call_submissions_delete on public.open_call_submissions
  for delete using (private.is_org_member(org_id));

-- ───────── talent_profiles ─────────
drop policy if exists talent_profiles_org_select on public.talent_profiles;
drop policy if exists talent_profiles_self_select on public.talent_profiles;
drop policy if exists talent_profiles_public_select on public.talent_profiles;
drop policy if exists talent_profiles_org_insert on public.talent_profiles;
drop policy if exists talent_profiles_org_update on public.talent_profiles;
drop policy if exists talent_profiles_self_update on public.talent_profiles;
drop policy if exists talent_profiles_org_delete on public.talent_profiles;

create policy talent_profiles_select on public.talent_profiles
  for select using (
    (is_public = true and deleted_at is null)
    or private.is_org_member(org_id)
    or user_id = (select auth.uid())
  );
create policy talent_profiles_insert on public.talent_profiles
  for insert with check (private.is_org_member(org_id));
create policy talent_profiles_update on public.talent_profiles
  for update
  using (private.is_org_member(org_id) or user_id = (select auth.uid()))
  with check (private.is_org_member(org_id) or user_id = (select auth.uid()));
create policy talent_profiles_delete on public.talent_profiles
  for delete using (private.is_org_member(org_id));

-- ───────── reviews ─────────
drop policy if exists reviews_org_select on public.reviews;
drop policy if exists reviews_reviewer_self_select on public.reviews;
drop policy if exists reviews_public_select_released on public.reviews;
drop policy if exists reviews_org_insert on public.reviews;
drop policy if exists reviews_reviewer_self_insert on public.reviews;
drop policy if exists reviews_org_update on public.reviews;
drop policy if exists reviews_reviewer_self_update on public.reviews;
drop policy if exists reviews_org_delete on public.reviews;
drop policy if exists reviews_reviewer_self_delete on public.reviews;

create policy reviews_select on public.reviews
  for select using (
    released_at is not null
    or private.is_org_member(org_id)
    or reviewer_user_id = (select auth.uid())
  );
create policy reviews_insert on public.reviews
  for insert with check (private.is_org_member(org_id) or reviewer_user_id = (select auth.uid()));
create policy reviews_update on public.reviews
  for update
  using (private.is_org_member(org_id) or reviewer_user_id = (select auth.uid()))
  with check (private.is_org_member(org_id) or reviewer_user_id = (select auth.uid()));
create policy reviews_delete on public.reviews
  for delete using (private.is_org_member(org_id) or reviewer_user_id = (select auth.uid()));
