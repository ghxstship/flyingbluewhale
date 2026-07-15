-- The identity-filter sweep: "the app filters it" was never evidence about the DB.
-- (ADR-0008 Amendment 7 — the same class as chat self-join / time-off self-approval.)
--
-- ## Method
--
-- Amendment 5 found three live escalations by asking one question of four
-- surfaces: does RLS agree, if you skip the app and call PostgREST directly?
-- This migration asks it of the whole app. 253 server-side reads narrow by
-- identity in application code (`.eq("user_id", session.userId)` and 18 sibling
-- columns) across 65 tables. Each is the app asserting a boundary; each was
-- checked against the live policy, and every claim below was PROVEN over
-- PostgREST as crew@gvteway.test (`member` role / `crew` persona) — never
-- inferred from a predicate, and never from an absent error object. The rows
-- were read back after every write (Amendment 5 part 2, flag 1).
--
-- Most of the 65 are fine, and deliberately so: `tasks`, `invoices`,
-- `requisitions`, `crew_members` are org-readable because an operator console
-- is the point. There the app filter is a VIEW ("my work"), not a boundary.
-- The four below are different: each one carries a privacy or authority claim
-- that the database was not holding.
--
-- ## 1. time_entries — payroll was writable by anyone, for anyone
--
-- The sharpest. `time_entries_update` granted the band
-- ['owner','admin','manager','controller','collaborator','crew'] with NO
-- `user_id` pin at all, and `private.has_org_role` matches
-- `role::text = any(required) OR persona = any(required)` — so the `crew`
-- PERSONA matched, on a plain `member` role. Proven:
--
--   · UPDATE another user's entry, setting rate_cents = 123456 — read back and
--     confirmed landed (duration_minutes bounced back to 240: a trigger
--     recomputes it from the timestamps, which is a real defence, but it does
--     not cover the pay rate)
--   · INSERT an 8-hour entry ATTRIBUTED to another user at rate 99999 —
--     fabricated payroll for a third party
--   · SELECT another user's entry (rate_cents, punch GPS, pulse_note)
--
-- `/p/[slug]/crew/time` is mounted on the portal and filters `user_id` in the
-- app, so this was reachable by portal personas — the Amendment 5 audience.
--
-- The fix is not invented: `mileage_logs` and `expenses` — the two sibling
-- tables of the same shape — ALREADY carry the correct predicate
-- (`has_org_role(staff) OR (is_org_member AND <self> = auth.uid())`).
-- time_entries was the outlier. This brings it in line with its own neighbours.
--
-- `controller` is dropped (it is neither a role nor a persona — dead text in
-- ~405 policies, see policy-vocabulary-canon.test.ts). `collaborator` is KEPT:
-- the existing grant includes it, and removing a band on a guess is how a
-- security fix becomes an outage (Amendment 5 part 3, where dropping the
-- `is_org_member` disjunct from `shifts` would have cut off every manager).
-- `crew` is dropped from the staff band and served by the self clause instead —
-- that is the entire hole. Every persona that punches its own time (crew,
-- volunteer, anyone) still matches the self clause, so the band question is
-- moot for own-row writes.
--
-- SELECT narrows to staff-or-self on the `shifts` precedent (part 3), and more
-- safely than shifts: every time_entries row HAS a user_id, where all 16 shifts
-- had NULL. One honest consequence: the `/studio` home strip tile counts open
-- entries org-wide, so a non-staff persona loading the operator Home would see
-- only their own count. That tile is an operator surface and crew live in /m
-- (ADR-0008 Amendment 4); the degradation is cosmetic and limited to a persona
-- that is not its audience.
--
-- ## 2. reviews — any member could rewrite or delete reputation
--
-- `reviews_{select,insert,update,delete}` all lead with `is_org_member(org_id)`,
-- which SUBSUMES the narrow `reviewer_user_id = auth.uid()` disjunct sitting
-- beside it — the same "three clauses that collapse to one" shape as
-- `shifts_select_consolidated`. Proven as crew:
--
--   · UPDATE another person's review 4 stars -> 1 star, body replaced (read
--     back, then restored)
--   · SELECT an UNRELEASED review (rating 1, candid body) as a third party who
--     is neither its reviewer nor its subject
--
-- `tg_reviews_aggregate` rolls `rating_avg`/`rating_count` onto the subject, so
-- rewriting a review rewrites a public rating. DELETE was equally open: remove
-- the 1-star review about yourself.
--
-- The blind is a documented product invariant (CLAUDE.md: insert a counterpart
-- review and both rows auto-flip `released_at`), and the app already enforces
-- it — `/me/reviews` reads received reviews with `.not("released_at","is",null)`.
-- The database now says the same thing. Moderation (`/studio/marketplace/reviews`
-- reads org-wide incl. unreleased) moves from "any member" to the staff band:
-- being in the org is not authority to moderate, exactly as being in the org was
-- not authority to decide leave.
--
-- Safe because BOTH triggers are SECURITY DEFINER: `tg_reviews_release_pair`
-- UPDATEs the counterpart row (whose reviewer is someone else) and
-- `tg_reviews_aggregate` writes vendors/talent_profiles/crew_members/
-- user_profiles. They bypass RLS, so narrowing UPDATE cannot break mutual
-- release or the rating rollup. Checked before writing this, because a
-- non-DEFINER trigger here would have made the obvious fix an outage.
--
-- ## 3. redeem_voucher — credit anyone's account
--
-- SECURITY DEFINER, EXECUTE granted to `authenticated`, and it checks NOTHING:
-- not that `auth.uid() = p_user_id`, not that the caller belongs to p_org_id.
-- The app calls it with `session.userId` (legend/store/actions.ts); a PostgREST
-- caller passes whatever it likes. Proven: as crew, redeemed a voucher crediting
-- a DIFFERENT user's credit_ledger and burned its only redemption.
-- `approve_time_off_request` was the worked example of this exact shape; the
-- code is the credential (gift-card model), but who it credits is not the
-- caller's to choose.
--
-- ## 4. badge_awards / achievement_awards — self-grant
--
-- `badge_awards_org_rw` is FOR ALL `is_org_member` both ways, and
-- `achievement_awards_insert` is `is_org_member`. Proven: awarded myself a badge
-- as a plain member (read back, then removed). Low severity — recognition, not
-- money — but it is a self-grant of a thing whose entire meaning is that someone
-- else gave it to you. The only writer is the staff action
-- `/studio/workforce/badges/[badgeId]` (awardBadge, which sets `awarded_by`);
-- no DB function writes either table and nothing in the app writes
-- achievement_awards at all, so staff-only INSERT breaks no path.
--
-- Reads stay org-wide on both: the badge wall and leaderboard are meant to be
-- seen. That is a view, not a boundary.

-- ---------------------------------------------------------------------------
-- 1. time_entries
-- ---------------------------------------------------------------------------

drop policy if exists time_entries_select on public.time_entries;
drop policy if exists time_entries_insert on public.time_entries;
drop policy if exists time_entries_update on public.time_entries;
drop policy if exists time_entries_delete on public.time_entries;

-- Staff, or the person the entry belongs to.
create policy time_entries_select on public.time_entries
  for select using (
    private.has_org_role(org_id, array['owner', 'admin', 'manager', 'collaborator'])
    or (private.is_org_member(org_id) and user_id = (select auth.uid()))
  );

-- Staff may file for anyone (a manager entering a crew member's hours);
-- everyone else may file only their own.
create policy time_entries_insert on public.time_entries
  for insert with check (
    private.has_org_role(org_id, array['owner', 'admin', 'manager', 'collaborator'])
    or (private.is_org_member(org_id) and user_id = (select auth.uid()))
  );

-- Both USING and WITH CHECK, explicitly: USING picks the rows you may touch,
-- WITH CHECK pins the result, so a member cannot reassign their entry to
-- someone else on the way out.
create policy time_entries_update on public.time_entries
  for update using (
    private.has_org_role(org_id, array['owner', 'admin', 'manager', 'collaborator'])
    or (private.is_org_member(org_id) and user_id = (select auth.uid()))
  ) with check (
    private.has_org_role(org_id, array['owner', 'admin', 'manager', 'collaborator'])
    or (private.is_org_member(org_id) and user_id = (select auth.uid()))
  );

-- Unchanged: owner/admin only.
create policy time_entries_delete on public.time_entries
  for delete using (private.has_org_role(org_id, array['owner', 'admin']));

-- ---------------------------------------------------------------------------
-- 2. reviews
-- ---------------------------------------------------------------------------

drop policy if exists reviews_select on public.reviews;
drop policy if exists reviews_insert on public.reviews;
drop policy if exists reviews_update on public.reviews;
drop policy if exists reviews_delete on public.reviews;

-- Released reviews stay readable (that is the point of releasing them).
-- Unreleased: only its author, or staff moderating.
create policy reviews_select on public.reviews
  for select using (
    released_at is not null
    or reviewer_user_id = (select auth.uid())
    or private.has_org_role(org_id, array['owner', 'admin', 'manager'])
  );

-- You may only write a review as yourself. Staff may seed/import.
create policy reviews_insert on public.reviews
  for insert with check (
    (private.is_org_member(org_id) and reviewer_user_id = (select auth.uid()))
    or private.has_org_role(org_id, array['owner', 'admin', 'manager'])
  );

create policy reviews_update on public.reviews
  for update using (
    reviewer_user_id = (select auth.uid())
    or private.has_org_role(org_id, array['owner', 'admin', 'manager'])
  ) with check (
    reviewer_user_id = (select auth.uid())
    or private.has_org_role(org_id, array['owner', 'admin', 'manager'])
  );

create policy reviews_delete on public.reviews
  for delete using (
    reviewer_user_id = (select auth.uid())
    or private.has_org_role(org_id, array['owner', 'admin', 'manager'])
  );

-- ---------------------------------------------------------------------------
-- 3. redeem_voucher — the caller may only credit themselves
-- ---------------------------------------------------------------------------

create or replace function public.redeem_voucher(p_org_id uuid, p_user_id uuid, p_code text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_id uuid;
  v_credits integer;
  v_max integer;
  v_count integer;
  v_expires date;
  v_state text;
  v_next_count integer;
begin
  -- SECURITY DEFINER bypasses RLS, so every check the policies would have made
  -- has to be in here. The app passes session.userId; a PostgREST caller passes
  -- whatever it likes, and could credit another user's ledger (and burn their
  -- one redemption). The code is the credential; who it credits is not the
  -- caller's choice.
  if p_user_id is distinct from (select auth.uid()) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  if not private.is_org_member(p_org_id) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  select id, credits, max_redemptions, redeemed_count, expires_on, voucher_state
    into v_id, v_credits, v_max, v_count, v_expires, v_state
    from public.vouchers
   where org_id = p_org_id and code = p_code and deleted_at is null
   for update;

  if v_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if v_state <> 'active' then
    return jsonb_build_object('ok', false, 'reason', 'inactive');
  end if;
  if v_expires is not null and (v_expires + interval '1 day') <= now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;
  if v_count >= v_max then
    return jsonb_build_object('ok', false, 'reason', 'fully_redeemed');
  end if;

  begin
    insert into public.voucher_redemptions (org_id, voucher_id, user_id, credits)
      values (p_org_id, v_id, p_user_id, v_credits);
  exception when unique_violation then
    insert into public.credit_ledger (org_id, user_id, delta, reason, ref_kind, ref_id)
      values (p_org_id, p_user_id, v_credits, 'Voucher ' || p_code, 'voucher', v_id)
      on conflict (ref_kind, ref_id, user_id) where ref_kind is not null and ref_id is not null
      do nothing;
    return jsonb_build_object('ok', false, 'reason', 'already_redeemed');
  end;

  insert into public.credit_ledger (org_id, user_id, delta, reason, ref_kind, ref_id)
    values (p_org_id, p_user_id, v_credits, 'Voucher ' || p_code, 'voucher', v_id)
    on conflict (ref_kind, ref_id, user_id) where ref_kind is not null and ref_id is not null
    do nothing;

  v_next_count := v_count + 1;
  update public.vouchers
     set redeemed_count = v_next_count,
         voucher_state = case when v_next_count >= v_max then 'redeemed' else 'active' end
   where id = v_id;

  return jsonb_build_object('ok', true, 'credits', v_credits);
end;
$function$;

comment on function public.redeem_voucher(uuid, uuid, text) is
  'SECURITY DEFINER. Refuses unless p_user_id = auth.uid() AND the caller is a member of p_org_id — a member could otherwise credit any user''s ledger and burn their redemption (ADR-0008 Amendment 7).';

-- ---------------------------------------------------------------------------
-- 4. badge_awards / achievement_awards — awarding is a staff act
-- ---------------------------------------------------------------------------

drop policy if exists badge_awards_org_rw on public.badge_awards;

-- The wall is meant to be seen.
create policy badge_awards_select on public.badge_awards
  for select using (private.is_org_member(org_id));

create policy badge_awards_insert on public.badge_awards
  for insert with check (private.has_org_role(org_id, array['owner', 'admin', 'manager']));

create policy badge_awards_update on public.badge_awards
  for update using (private.has_org_role(org_id, array['owner', 'admin', 'manager']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager']));

create policy badge_awards_delete on public.badge_awards
  for delete using (private.has_org_role(org_id, array['owner', 'admin', 'manager']));

drop policy if exists achievement_awards_insert on public.achievement_awards;

create policy achievement_awards_insert on public.achievement_awards
  for insert with check (private.has_org_role(org_id, array['owner', 'admin', 'manager']));
