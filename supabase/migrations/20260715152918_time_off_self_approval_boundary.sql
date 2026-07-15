-- Time off: the app was the only thing stopping you approving your own leave.
-- (ADR-0008 Amendment 5, follow-up — the same class as the chat self-join.)
--
-- ## The defect
--
-- Amendment 1 waved `TimeOffSurface` through as "already user-scoped
-- (.eq("user_id", session.userId))". That audited the APP filter. It did not
-- ask whether RLS agreed if you skip the app. It did not.
--
-- Confirmed against the live DB as crew@gvteway.test (`member` band), via
-- PostgREST, with nothing but a normal login:
--
--   · read 10 OTHER people's time_off_requests, including the free-text
--     `reason` column ("Smoke request from owner", …)
--   · read 4 other people's time_off_balances
--   · file a request, then flip it to approved with a plain UPDATE
--   · approve it again through the approve_time_off_request RPC
--   · set my own balance_hours to 9999
--   · write ANOTHER user's balance row
--
-- Both surfaces are mounted on the `vendor` portal persona
-- (/p/[slug]/vendor/time-off), so this was reachable by external contractors —
-- the exact audience Amendment 1 narrowed DirectorySurface for.
--
-- Two independent causes, both "the gate is in the app":
--
-- 1. `time_off_requests_org_rw` / `time_off_balances_self_or_org` are FOR ALL
--    with `is_org_member(org_id)` as the WITH CHECK. Any org member could
--    therefore write any row. The app's gate (`isManagerPlus` in
--    `decideTimeOffRequest`) carries the comment "Re-checked here rather than
--    trusted from the caller so neither shell can skip the gate by hiding a
--    button" — true of both shells, and irrelevant to a PostgREST call.
--
-- 2. `approve_time_off_request` is SECURITY DEFINER, granted EXECUTE to
--    `authenticated`, and checks only `private.is_org_member(v_req.org_id)`.
--    Its own comment says so: "SECURITY DEFINER but checks private.is_org_member
--    before mutating." Being a member of the org is not authority to decide
--    leave — least of all your own.
--
-- ## The fix
--
-- Split both tables into explicit per-command policies and put the manager band
-- in the database, matching `MANAGER_BAND_ROLES` = owner|admin|manager exactly
-- (private.has_org_role matches role::text OR persona, so a crew persona on a
-- `member` role does not qualify). Then teach the RPC the same rule, so neither
-- door is weaker than the other.
--
--   time_off_requests  SELECT  my own, or manager+
--                      INSERT  my own AND request_state='pending', or manager+
--                              — the state pin matters: self-INSERT alone would
--                                let a member file a row that is already
--                                'approved' and skip the decision entirely
--                      UPDATE  manager+ only (decisions are HR-level)
--                      DELETE  manager+ only
--   time_off_balances  SELECT  my own, or manager+
--                      INSERT/UPDATE/DELETE  manager+ only. The approve RPC is
--                              SECURITY DEFINER and does the balance upsert
--                              itself, so members never need write here.
--
-- No cancel/withdraw flow exists today (`cancelled` is a display-only state in
-- TimeOffSurface; nothing writes it), so manager-only UPDATE breaks nothing. If
-- one is built later it wants its own narrow policy — self, pending→cancelled —
-- not a reopening of the member write path.
--
-- `personal_documents` (DocsSurface) was audited in the same pass and is
-- genuinely self-scoped at the DB (`personal_documents_self_rw` USING/WITH CHECK
-- `user_id = auth.uid()`). No change. `shifts` and `workforce_members` are
-- org-member-readable; that is consistent with the documented co-member model
-- and is load-bearing for shift-swap browsing and the volunteer/ops schedule
-- boards, so it is left alone and written up in the ADR rather than narrowed
-- here on a guess.

-- ── time_off_requests ──────────────────────────────────────────────────────

drop policy if exists time_off_requests_org_rw on public.time_off_requests;

create policy time_off_requests_select on public.time_off_requests
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.has_org_role(org_id, array['owner','admin','manager'])
  );

create policy time_off_requests_insert on public.time_off_requests
  for insert to authenticated
  with check (
    (
      user_id = (select auth.uid())
      and private.is_org_member(org_id)
      -- File as pending or not at all. Without this a member could INSERT a
      -- row that is born approved.
      and request_state = 'pending'
    )
    or private.has_org_role(org_id, array['owner','admin','manager'])
  );

create policy time_off_requests_update on public.time_off_requests
  for update to authenticated
  using (private.has_org_role(org_id, array['owner','admin','manager']))
  with check (private.has_org_role(org_id, array['owner','admin','manager']));

create policy time_off_requests_delete on public.time_off_requests
  for delete to authenticated
  using (private.has_org_role(org_id, array['owner','admin','manager']));

-- ── time_off_balances ──────────────────────────────────────────────────────

drop policy if exists time_off_balances_self_or_org on public.time_off_balances;

create policy time_off_balances_select on public.time_off_balances
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.has_org_role(org_id, array['owner','admin','manager'])
  );

create policy time_off_balances_insert on public.time_off_balances
  for insert to authenticated
  with check (private.has_org_role(org_id, array['owner','admin','manager']));

create policy time_off_balances_update on public.time_off_balances
  for update to authenticated
  using (private.has_org_role(org_id, array['owner','admin','manager']))
  with check (private.has_org_role(org_id, array['owner','admin','manager']));

create policy time_off_balances_delete on public.time_off_balances
  for delete to authenticated
  using (private.has_org_role(org_id, array['owner','admin','manager']));

-- ── approve_time_off_request ───────────────────────────────────────────────
-- Same body as the baseline, with the membership check upgraded to the manager
-- band and an explicit self-approval refusal. Both matter independently: the
-- band stops a member deciding anyone's leave, and the self-check stops a
-- manager rubber-stamping their own (managers file leave too, and their own
-- request is the one they must not be able to sign off).

create or replace function public.approve_time_off_request(
  p_request_id uuid,
  p_decider_id uuid,
  p_decision_note text default null
) returns public.time_off_requests
  language plpgsql
  security definer
  set search_path to 'public'
as $$
DECLARE
  v_req public.time_off_requests%ROWTYPE;
  v_year int;
BEGIN
  SELECT * INTO v_req FROM public.time_off_requests WHERE id = p_request_id AND request_state = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'time_off_request % not pending or not found', p_request_id;
  END IF;

  -- SECURITY DEFINER bypasses RLS, so every check the policies would have made
  -- has to be made here by hand. This used to be is_org_member, which is not
  -- authority to decide leave.
  IF NOT private.has_org_role(v_req.org_id, array['owner','admin','manager']) THEN
    RAISE EXCEPTION 'caller lacks manager access in org %', v_req.org_id
      USING ERRCODE = '42501';
  END IF;

  -- No self-approval, whatever your role.
  IF v_req.user_id = (select auth.uid()) THEN
    RAISE EXCEPTION 'you may not decide your own time-off request'
      USING ERRCODE = '42501';
  END IF;

  v_year := EXTRACT(YEAR FROM v_req.starts_on)::int;

  INSERT INTO public.time_off_balances (org_id, user_id, policy_id, year, balance_hours, accrued_ytd_hours, used_ytd_hours)
  VALUES (v_req.org_id, v_req.user_id, v_req.policy_id, v_year, -v_req.hours_requested, 0, v_req.hours_requested)
  ON CONFLICT (user_id, policy_id, year)
  DO UPDATE SET
    balance_hours = public.time_off_balances.balance_hours - v_req.hours_requested,
    used_ytd_hours = public.time_off_balances.used_ytd_hours + v_req.hours_requested,
    updated_at = now();

  -- Body below is the baseline's, verbatim. Only the two authorization checks
  -- above are new — a security fix should not quietly re-specify the behaviour
  -- it is protecting (the trailing `request_state = 'pending'` re-check guards
  -- the read→write race and stays exactly as it was).
  UPDATE public.time_off_requests
  SET request_state = 'approved',
      decided_by = p_decider_id,
      decided_at = now(),
      decision_note = p_decision_note
  WHERE id = p_request_id AND request_state = 'pending'
  RETURNING * INTO v_req;

  RETURN v_req;
END;
$$;

comment on function public.approve_time_off_request(uuid, uuid, text) is
  'Approve a pending time_off_request + decrement the matching balance. Called from studio/workforce/time-off/actions.ts via decideTimeOffRequest. SECURITY DEFINER: enforces the owner|admin|manager band AND refuses self-approval, because it bypasses RLS and is EXECUTE-granted to authenticated.';
