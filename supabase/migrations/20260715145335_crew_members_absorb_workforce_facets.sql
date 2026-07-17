-- Fold workforce_members' facets onto crew_members, and give shifts a person.
--
-- Phase A of the workforce_members → crew_members merge (ADR-0015 addendum).
-- Follows the repo's own precedent for collapsing a parallel store into the
-- SSOT: equipment → assets (asset_class/qty/disposition facets, kit 20 Phase A)
-- and sub_invoices → invoices (source facet).
--
-- WHY crew_members IS THE SSOT — settled by FK gravity, not preference:
--   crew_members       ← 8 tables (assignments, credentials, crew_certifications,
--                        crew_ratings, independent_contractor_msas, offer_letters,
--                        org_offer_letter_settings, safety_briefing_attendees)
--   workforce_members  ← 1 table (shifts)
-- The two also describe different populations: zero email overlap between them,
-- and zero workforce_members rows match an auth.users. All 105 workforce rows
-- are e2e debris ('E2E Staff 1780772567208'); 0 have a login, venue, skills or
-- metadata. Every shift lives in `demo` while every workforce_member lives in
-- test-portal/test-professional — disjoint orgs, so shifts.workforce_member_id
-- could never have been satisfied. It is null on all 16 rows.
--
-- crew_members already carries most of the overlap (engagement_state,
-- separated_at, separation_reason, role, email, phone, name). Only four facets
-- are genuinely unique to workforce_members, added here.
--
-- ADDITIVE ONLY. This migration adds columns and one FK; it drops nothing and
-- deletes nothing. workforce_members and its CRUD surfaces (/studio/workforce/
-- {staff,volunteers,contractors}) keep working until the code is repointed — a
-- merge that breaks the app the moment it lands is not a merge, it is an outage.

-- ── 1. The facets ────────────────────────────────────────────────────────────

-- The workforce discriminator: paid_staff / volunteer / contractor / official.
-- Named `workforce_kind` (not `kind`) to match the assets.asset_class precedent:
-- a facet folded in from a merged store keeps a qualified name so its origin
-- stays legible.
ALTER TABLE "public"."crew_members"
  ADD COLUMN IF NOT EXISTS "workforce_kind" "public"."workforce_kind" DEFAULT 'paid_staff'::"public"."workforce_kind" NOT NULL;

-- Venue staffing. crew_members had no venue anchor; workforce_members did.
ALTER TABLE "public"."crew_members"
  ADD COLUMN IF NOT EXISTS "venue_id" "uuid";
ALTER TABLE "public"."crew_members"
  DROP CONSTRAINT IF EXISTS "crew_members_venue_id_fkey";
ALTER TABLE "public"."crew_members"
  ADD CONSTRAINT "crew_members_venue_id_fkey"
  FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE SET NULL;

-- NOTE: `skills` and `metadata` are folded for model fidelity, but be aware
-- they carry ZERO data in every live row — they are aspirational columns on the
-- source table, not a dataset being preserved. crew_members already has richer,
-- actually-populated equivalents (`certifications` text[], `gear_owned` jsonb,
-- `roles` text[]); prefer those. `skills` exists so the volunteer surfaces can
-- repoint without losing their shape.
ALTER TABLE "public"."crew_members"
  ADD COLUMN IF NOT EXISTS "skills" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL;
ALTER TABLE "public"."crew_members"
  ADD COLUMN IF NOT EXISTS "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL;

CREATE INDEX IF NOT EXISTS "crew_members_org_workforce_kind_idx"
  ON "public"."crew_members" ("org_id", "workforce_kind");
CREATE INDEX IF NOT EXISTS "crew_members_venue_idx"
  ON "public"."crew_members" ("venue_id") WHERE "venue_id" IS NOT NULL;

COMMENT ON COLUMN "public"."crew_members"."workforce_kind" IS
  'Folded in from workforce_members.kind (merge, ADR-0015 addendum). paid_staff/volunteer/contractor/official — the discriminator the /studio/workforce/{staff,volunteers,contractors} surfaces filter on.';
COMMENT ON COLUMN "public"."crew_members"."skills" IS
  'Folded in from workforce_members.skills. Carried ZERO data at merge time. Prefer certifications/roles/gear_owned, which are populated.';

-- ── 2. shifts gets a person ─────────────────────────────────────────────────
-- workforce_member_id stays for now (it is null on every row) and is dropped in
-- Phase B, once the readers are repointed.

ALTER TABLE "public"."shifts"
  ADD COLUMN IF NOT EXISTS "crew_member_id" "uuid";
ALTER TABLE "public"."shifts"
  DROP CONSTRAINT IF EXISTS "shifts_crew_member_id_fkey";
ALTER TABLE "public"."shifts"
  ADD CONSTRAINT "shifts_crew_member_id_fkey"
  FOREIGN KEY ("crew_member_id") REFERENCES "public"."crew_members"("id") ON DELETE SET NULL;

-- The /m/schedule lookup: "my shifts", resolved crew_member → user.
CREATE INDEX IF NOT EXISTS "shifts_crew_member_idx"
  ON "public"."shifts" ("crew_member_id") WHERE "crew_member_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "shifts_org_starts_idx"
  ON "public"."shifts" ("org_id", "starts_at");

COMMENT ON COLUMN "public"."shifts"."crew_member_id" IS
  'The person working this shift. Replaces workforce_member_id (null on every row; its target org never even matched). crew_members is the person SSOT — 8 tables reference it.';

-- Nothing to backfill: shifts.workforce_member_id is null on all 16 rows.
-- Asserted rather than assumed — if a future replay finds data here, this
-- migration must gain a real backfill instead of silently dropping the link.
DO $$
DECLARE v_orphans int;
BEGIN
  SELECT count(*) INTO v_orphans FROM public.shifts WHERE workforce_member_id IS NOT NULL;
  IF v_orphans > 0 THEN
    RAISE EXCEPTION 'shifts.workforce_member_id has % rows — this migration assumed none and would silently drop the link. Write a backfill.', v_orphans;
  END IF;
END $$;
