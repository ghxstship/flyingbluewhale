-- Close the FOR ALL / no-WITH-CHECK trap repo-wide (ADR-0008 Amendment 5).
--
-- A `create policy … for all … using (X)` with no `with check` silently reuses
-- X as the write check. That is not a quirk we can rely on people remembering:
-- it is what turned chat's read rule ("rows of rooms you belong to") into a
-- write rule ("you may insert yourself into any room"), in a migration whose own
-- header said "no new access is introduced". Reviewing a diff, the omission is
-- invisible — there is nothing on the line to notice.
--
-- After the chat + time-off fixes, a live sweep found exactly 3 policies left in
-- that shape out of 357 FOR ALL policies:
--
--   ai_proposal_drafts.org_members_all     using private.is_org_member(org_id)
--   ai_risk_reports.org_members_all        using private.is_org_member(org_id)
--   ai_schedule_suggestions.org_members_all using private.is_org_member(org_id)
--
-- None of these is a vulnerability. Their USING is `is_org_member(org_id)` —
-- org-scoped data with no per-user or per-role distinction — so the inherited
-- write check is exactly the write check you would have written anyway. That is
-- the whole difference from chat, where USING encoded a *membership* rule that
-- had no business being a write rule.
--
-- So this migration changes NO behaviour. `with check` is set to the identical
-- expression Postgres was already applying. The point is to spend three lines
-- making intent explicit so the canon can be absolute — zero FOR ALL policies
-- relying on the inheritance — and so `chat-membership-boundary.test.ts` can
-- assert that as a repo-wide invariant instead of a chat-only one. A rule with
-- three "known exceptions" is a rule nobody enforces.

alter policy org_members_all on public.ai_proposal_drafts
  using (private.is_org_member(org_id))
  with check (private.is_org_member(org_id));

alter policy org_members_all on public.ai_risk_reports
  using (private.is_org_member(org_id))
  with check (private.is_org_member(org_id));

alter policy org_members_all on public.ai_schedule_suggestions
  using (private.is_org_member(org_id))
  with check (private.is_org_member(org_id));
