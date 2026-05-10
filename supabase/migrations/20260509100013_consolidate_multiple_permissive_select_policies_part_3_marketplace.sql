-- Part 3 of multiple-permissive-policy consolidation: marketplace tables
-- whose self-* policies are scoped to columns the org_rw policy doesn't see.
-- Strategy is the same — split FOR ALL into FOR INSERT/UPDATE/DELETE — but
-- both the org-rw side and the self side need the split because both
-- carry SELECT-applicable USING clauses on these tables.
--
-- Note: after this part, 4 tables (job_applications, open_call_submissions,
-- reviews, talent_profiles) still have multiple permissive SELECT policies.
-- That is intentional — org member, self, and public-released are
-- legitimately different access paths that can't be merged without
-- changing semantics.

-- ───────── job_applications (3 dup tuples: INSERT, SELECT, UPDATE) ─────────
drop policy if exists job_applications_org_rw on public.job_applications;
create policy job_applications_org_select on public.job_applications for select using (private.is_org_member(org_id));
create policy job_applications_org_insert on public.job_applications for insert with check (private.is_org_member(org_id));
create policy job_applications_org_update on public.job_applications for update using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));
create policy job_applications_org_delete on public.job_applications for delete using (private.is_org_member(org_id));

-- ───────── open_call_submissions (2 dup tuples: INSERT, SELECT) ─────────
drop policy if exists open_call_submissions_org_rw on public.open_call_submissions;
create policy open_call_submissions_org_select on public.open_call_submissions for select using (private.is_org_member(org_id));
create policy open_call_submissions_org_insert on public.open_call_submissions for insert with check (private.is_org_member(org_id));
create policy open_call_submissions_org_update on public.open_call_submissions for update using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));
create policy open_call_submissions_org_delete on public.open_call_submissions for delete using (private.is_org_member(org_id));

-- ───────── reviews (4 dup tuples: D, I, S(3-way), U) ─────────
-- reviews_public_select_released stays (released-only public read).
-- reviews_org_rw + reviews_reviewer_self both FOR ALL → split each.
drop policy if exists reviews_org_rw on public.reviews;
drop policy if exists reviews_reviewer_self on public.reviews;
create policy reviews_org_select on public.reviews for select using (private.is_org_member(org_id));
create policy reviews_org_insert on public.reviews for insert with check (private.is_org_member(org_id));
create policy reviews_org_update on public.reviews for update using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));
create policy reviews_org_delete on public.reviews for delete using (private.is_org_member(org_id));
create policy reviews_reviewer_self_select on public.reviews for select using (reviewer_user_id = (select auth.uid()));
create policy reviews_reviewer_self_insert on public.reviews for insert with check (reviewer_user_id = (select auth.uid()));
create policy reviews_reviewer_self_update on public.reviews for update using (reviewer_user_id = (select auth.uid())) with check (reviewer_user_id = (select auth.uid()));
create policy reviews_reviewer_self_delete on public.reviews for delete using (reviewer_user_id = (select auth.uid()));

-- ───────── talent_profiles (S 3-way, U 2-way) ─────────
drop policy if exists talent_profiles_org_rw on public.talent_profiles;
create policy talent_profiles_org_select on public.talent_profiles for select using (private.is_org_member(org_id));
create policy talent_profiles_org_insert on public.talent_profiles for insert with check (private.is_org_member(org_id));
create policy talent_profiles_org_update on public.talent_profiles for update using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));
create policy talent_profiles_org_delete on public.talent_profiles for delete using (private.is_org_member(org_id));
