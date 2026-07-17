-- Drop workforce_members + shifts.workforce_member_id — SCANNING_RBAC_BACKLOG
-- P3.6, the last step of the workforce_members → crew_members merge
-- (ADR-0015 addendum).
--
-- Phase A (20260715145335) folded the facets onto crew_members and gave shifts
-- crew_member_id. Phase B repointed every reader (`c809cfb6` moved the shift
-- join keys; the from("workforce_members") table reads were repointed
-- alongside). This migration supersedes the never-applied
-- 20260715220000_retire_workforce_members.sql from branch
-- claude/infallible-leakey-5365a2 — same shape, re-verified against today's
-- main before writing:
--
--   git grep 'from("workforce_members")' HEAD -- src   → 0 readers
--   git grep 'workforce_member_id'        HEAD -- src   → comments only
--
-- (Grep the REF, never the tree — docs/SHIP_MAIN_STATE.md. Both the table name
-- and the column name were swept separately; the column is the join key and
-- goes quiet first, which is exactly how the earlier false-clean happened.)
--
-- ⚠ ORDERING IS LOAD-BEARING: do not apply until the repointed code is the
-- DEPLOYED ref. PostgREST errors on a select naming a dropped column, so
-- migrating ahead of the deploy takes the volunteer portal, call sheets and
-- the operations schedule down. The repointed code reads crew_member_id,
-- which Phase A already added — code-then-migration is the zero-downtime
-- order.
--
-- WHAT IS LOST: nothing. All 105 workforce_members rows are e2e debris
-- ('E2E Staff …') — 0 have a login, 0 match an auth.users row, 0 carry
-- venue/skills/metadata, and they live in orgs that hold no shifts. They are
-- NOT backfilled into crew_members: importing 105 junk rows into the person
-- SSOT would be a regression, not a rescue. The guards below re-assert this
-- at apply time rather than trusting the note.

-- ── 0. Guards: refuse if the debris verdict no longer holds ─────────────────
DO $$
DECLARE v_set int;
BEGIN
  -- The shift link was never satisfiable; if a writer appeared in between,
  -- this must not silently drop real data.
  SELECT count(*) INTO v_set FROM public.shifts WHERE workforce_member_id IS NOT NULL;
  IF v_set > 0 THEN
    RAISE EXCEPTION 'shifts.workforce_member_id has % non-null row(s) — dropping it would lose the link. Backfill crew_member_id from it first.', v_set;
  END IF;

  -- The 105-rows-of-debris verdict: 0 rows had a login when this was written.
  -- A row with a user_id is a person, not debris.
  SELECT count(*) INTO v_set FROM public.workforce_members WHERE user_id IS NOT NULL;
  IF v_set > 0 THEN
    RAISE EXCEPTION 'workforce_members has % row(s) with a user_id — the e2e-debris verdict no longer holds. Re-audit before dropping.', v_set;
  END IF;
END $$;

-- ── 1. The policy must stop depending on the column BEFORE the drop ─────────
-- `ALTER TABLE shifts DROP COLUMN workforce_member_id` fails with 2BP01:
-- shifts_select_consolidated (Amendment 5, 20260715210000) names the column in
-- a USING branch. Do NOT clear it with DROP COLUMN ... CASCADE — that drops
-- the whole policy, taking the crew_members self-read branch with it, and
-- silently turns "a worker can see their own shift" into "only the staff band
-- can see shifts". RLS does not error when it over-restricts.
--
-- Amendment 5 wrote the policy dual-keyed on purpose ("so the merge can land
-- or revert without breaking"). The merge has landed; only the dead
-- workforce_members branch is removed. Two invariants preserved verbatim,
-- both load-bearing and both asserted by
-- src/lib/chat-membership-boundary.test.ts (which reads the LAST policy body
-- in the migration chain — i.e. this one):
--   * 'manager' STAYS in the staff band — the pre-Amendment-5 band omitted it
--     and leaned on an is_org_member disjunct; dropping that disjunct without
--     naming manager cuts every manager off from every shift.
--   * NO is_org_member disjunct returns — it subsumed the other branches and
--     was exactly "any org member reads every shift", the hole Amendment 5
--     closed.
DROP POLICY IF EXISTS "shifts_select_consolidated" ON "public"."shifts";
CREATE POLICY "shifts_select_consolidated" ON "public"."shifts"
  FOR SELECT TO "authenticated"
  USING (
    private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'collaborator'::text])
    OR EXISTS (
      SELECT 1 FROM public.crew_members cm
      WHERE cm.id = shifts.crew_member_id
        AND cm.user_id = (SELECT auth.uid())
    )
  );

ALTER TABLE "public"."shifts" DROP CONSTRAINT IF EXISTS "shifts_workforce_member_id_fkey";
ALTER TABLE "public"."shifts" DROP COLUMN IF EXISTS "workforce_member_id";

-- ── 2. Drop the table ────────────────────────────────────────────────────────
-- Guard first: shifts held the only inbound FK, and section 1 just removed it.
-- If anything else has since pointed at this table, that is a real dependency
-- and the drop must be reconsidered rather than CASCADE'd through.
DO $$
DECLARE v_refs text;
BEGIN
  SELECT string_agg(conrelid::regclass::text, ', ') INTO v_refs
  FROM pg_constraint WHERE confrelid = 'public.workforce_members'::regclass;
  IF v_refs IS NOT NULL THEN
    RAISE EXCEPTION 'workforce_members still has inbound FK(s) from: %. Repoint them before dropping.', v_refs;
  END IF;
END $$;

-- No CASCADE: with the FK gone, a bare DROP is sufficient — its policies,
-- triggers and indexes go with the table. If the drop still fails, the
-- failure is information worth having rather than something to bulldoze.
-- The workforce_kind enum STAYS: crew_members.workforce_kind (Phase A) is a
-- live consumer.
DROP TABLE IF EXISTS "public"."workforce_members";
