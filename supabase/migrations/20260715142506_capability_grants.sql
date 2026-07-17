-- Add-on RBAC — grant capabilities by role, by individual, and for a window.
--
-- THE PROBLEM
-- ───────────
-- Capabilities today are static code (`CAPABILITIES` by platform role,
-- `CAPABILITIES_BY_PERSONA`). That can answer "what does a manager get". It
-- cannot answer "may Bob, who works logistics, scan assets tonight because he
-- is covering Dana's shift" — because roles like logistics and warehouse are
-- org DATA, they differ per tenant, and they change without a deploy.
--
-- `crew` currently holds `check-in:*`: every crew member can scan everything,
-- including credentials at a gate. That is the thing being fixed.
--
-- THE SHAPE — additive grants over the static floor:
--   BASE   (code, auth.ts)            the floor
--   ROLE   role_capability_grants     "logistics may scan assets"
--   USER   user_capability_grants     manual, and time-boxed for cover shifts
--   SHIFT  derived from the two above  (later — see the note at the bottom)
--
-- ADDITIVE ONLY. No denies, deliberately: a deny-list forces a precedence rule
-- and makes the system unauditable. "Not every role should scan credentials" is
-- expressed by not granting `scan:credential`.
--
-- ROLLOUT IS GRANDFATHERED. `orgs.capability_grants_enforced` defaults FALSE,
-- so on deploy day every crew member keeps the access they have now and nothing
-- in the field breaks. An org flips it to TRUE once its grants are configured;
-- only then do the grants become the source of truth. This is the only safe way
-- to tighten a live permission system.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. crew_roles — the role catalog.
--
-- Role grants CANNOT key on `crew_members.role`: it is free text and it has
-- already drifted. Live data shows slugs ('production-manager',
-- 'credentials-travel-logistics') sitting alongside prose ('A1 / Programmer',
-- 'Stage Manager', 'Stage Manager — cosmicMEADOW'). The last two are the same
-- job and different strings — grants keyed on that would be broken on day one.
-- A catalog gives roles a stable id to grant against.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."crew_roles" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "org_id" "uuid" NOT NULL,
  "slug" "text" NOT NULL,
  "name" "text" NOT NULL,
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "deleted_at" timestamp with time zone
);

ALTER TABLE "public"."crew_roles" OWNER TO "postgres";

ALTER TABLE ONLY "public"."crew_roles"
  ADD CONSTRAINT "crew_roles_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."crew_roles"
  ADD CONSTRAINT "crew_roles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "crew_roles_org_slug_uniq"
  ON "public"."crew_roles" ("org_id", "slug") WHERE "deleted_at" IS NULL;

COMMENT ON TABLE "public"."crew_roles" IS
  'Org-scoped job-role catalog (logistics, warehouse, …). Exists so capability grants have a stable id to key on — crew_members.role is free text and has drifted. See docs/compvss/SCANNING_UNIVERSAL_CAPTURE_PLAN.md.';
COMMENT ON COLUMN "public"."crew_roles"."slug" IS
  'Normalized key. Backfilled by slugifying crew_members.role; the display name keeps the original text.';

-- Link crew to the catalog. Nullable: 16 of 42 crew rows have no role at all,
-- and a crew member without a role simply has no role-derived grants.
ALTER TABLE "public"."crew_members"
  ADD COLUMN IF NOT EXISTS "crew_role_id" "uuid";
ALTER TABLE "public"."crew_members"
  DROP CONSTRAINT IF EXISTS "crew_members_crew_role_id_fkey";
ALTER TABLE "public"."crew_members"
  ADD CONSTRAINT "crew_members_crew_role_id_fkey"
  FOREIGN KEY ("crew_role_id") REFERENCES "public"."crew_roles"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "crew_members_crew_role_idx"
  ON "public"."crew_members" ("crew_role_id") WHERE "crew_role_id" IS NOT NULL;

COMMENT ON COLUMN "public"."crew_members"."crew_role_id" IS
  'FK to the role catalog. `role` (free text) is retained as the human label and the backfill source; crew_role_id is what capability grants key on.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. role_capability_grants — "logistics and warehouse may scan assets".
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."role_capability_grants" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "org_id" "uuid" NOT NULL,
  "crew_role_id" "uuid" NOT NULL,
  "capability" "text" NOT NULL,
  "shift_derivable" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "created_by" "uuid"
);

ALTER TABLE "public"."role_capability_grants" OWNER TO "postgres";

ALTER TABLE ONLY "public"."role_capability_grants"
  ADD CONSTRAINT "role_capability_grants_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."role_capability_grants"
  ADD CONSTRAINT "role_capability_grants_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."role_capability_grants"
  ADD CONSTRAINT "role_capability_grants_crew_role_id_fkey" FOREIGN KEY ("crew_role_id") REFERENCES "public"."crew_roles"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."role_capability_grants"
  ADD CONSTRAINT "role_capability_grants_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "role_capability_grants_role_cap_uniq"
  ON "public"."role_capability_grants" ("crew_role_id", "capability");
CREATE INDEX IF NOT EXISTS "role_capability_grants_org_idx"
  ON "public"."role_capability_grants" ("org_id");
CREATE INDEX IF NOT EXISTS "role_capability_grants_created_by_idx"
  ON "public"."role_capability_grants" ("created_by") WHERE "created_by" IS NOT NULL;

COMMENT ON COLUMN "public"."role_capability_grants"."shift_derivable" IS
  'When true, someone rostered onto a shift for this role picks the capability up for the shift window. This makes the SCHEDULER an authorization surface — intended for assets/products, and deliberately NOT for scan:credential, which must be granted explicitly and attributably.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. user_capability_grants — the individual + temporary path.
--
-- This is what answers "Bob is covering Dana's warehouse shift tonight":
-- valid_from/valid_until bound it to the window. No unique constraint — a user
-- may legitimately hold overlapping grants of the same capability from
-- different cover assignments; the resolver unions them.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."user_capability_grants" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "org_id" "uuid" NOT NULL,
  "user_id" "uuid" NOT NULL,
  "capability" "text" NOT NULL,
  "valid_from" timestamp with time zone,
  "valid_until" timestamp with time zone,
  "reason" "text",
  "granted_by" "uuid",
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."user_capability_grants" OWNER TO "postgres";

ALTER TABLE ONLY "public"."user_capability_grants"
  ADD CONSTRAINT "user_capability_grants_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."user_capability_grants"
  ADD CONSTRAINT "user_capability_grants_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."user_capability_grants"
  ADD CONSTRAINT "user_capability_grants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."user_capability_grants"
  ADD CONSTRAINT "user_capability_grants_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;
-- A window that ends before it starts is a data-entry error, not a grant.
ALTER TABLE ONLY "public"."user_capability_grants"
  ADD CONSTRAINT "user_capability_grants_window_check"
  CHECK ("valid_until" IS NULL OR "valid_from" IS NULL OR "valid_until" > "valid_from");

-- The session-resolution index: every request asks "this user, this org, live grants".
CREATE INDEX IF NOT EXISTS "user_capability_grants_lookup_idx"
  ON "public"."user_capability_grants" ("user_id", "org_id") WHERE "revoked_at" IS NULL;
CREATE INDEX IF NOT EXISTS "user_capability_grants_org_idx"
  ON "public"."user_capability_grants" ("org_id");
CREATE INDEX IF NOT EXISTS "user_capability_grants_granted_by_idx"
  ON "public"."user_capability_grants" ("granted_by") WHERE "granted_by" IS NOT NULL;

COMMENT ON TABLE "public"."user_capability_grants" IS
  'Per-individual add-on capability grants, optionally time-boxed. valid_from/valid_until are the answer to shift cover: grant scan:asset 18:00–02:00. Evaluated against server now() — never a client clock.';
COMMENT ON COLUMN "public"."user_capability_grants"."revoked_at" IS
  'Soft revoke. Grants are an audit trail: who could scan what, when, and who said so. Rows are never deleted in normal operation.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. The grandfather switch.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "public"."orgs"
  ADD COLUMN IF NOT EXISTS "capability_grants_enforced" boolean DEFAULT false NOT NULL;

COMMENT ON COLUMN "public"."orgs"."capability_grants_enforced" IS
  'FALSE (default) = legacy: crew keep the blanket check-in:* scanning they have today, grants are additive only. TRUE = grants are the source of truth for scan:* and the legacy blanket no longer applies. Flip per-org AFTER configuring grants — flipping first locks the field out.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RLS. Reads are org-wide (an operator must see who can do what);
--    writes are manager+ — granting a capability is an administrative act.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "public"."crew_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."role_capability_grants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_capability_grants" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crew_roles_select" ON "public"."crew_roles"
  FOR SELECT USING ("private"."is_org_member"("org_id"));
CREATE POLICY "crew_roles_write" ON "public"."crew_roles"
  FOR ALL USING ("private"."has_org_role"("org_id", ARRAY['owner','admin','manager']))
  WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner','admin','manager']));

CREATE POLICY "role_capability_grants_select" ON "public"."role_capability_grants"
  FOR SELECT USING ("private"."is_org_member"("org_id"));
CREATE POLICY "role_capability_grants_write" ON "public"."role_capability_grants"
  FOR ALL USING ("private"."has_org_role"("org_id", ARRAY['owner','admin','manager']))
  WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner','admin','manager']));

CREATE POLICY "user_capability_grants_select" ON "public"."user_capability_grants"
  FOR SELECT USING ("private"."is_org_member"("org_id"));
CREATE POLICY "user_capability_grants_write" ON "public"."user_capability_grants"
  FOR ALL USING ("private"."has_org_role"("org_id", ARRAY['owner','admin','manager']))
  WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner','admin','manager']));

-- Grants. NOTE THE REVOKES: ALTER DEFAULT PRIVILEGES on schema public hands
-- every new table anon=r + authenticated=arwd at creation, BEFORE any explicit
-- GRANT here runs — so omitting a grant grants nothing away. These tables say
-- who may bypass a gate; anon has no business reading them.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."crew_roles" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."role_capability_grants" TO "authenticated";
GRANT SELECT, INSERT, UPDATE ON TABLE "public"."user_capability_grants" TO "authenticated";
GRANT ALL ON TABLE "public"."crew_roles" TO "service_role";
GRANT ALL ON TABLE "public"."role_capability_grants" TO "service_role";
GRANT ALL ON TABLE "public"."user_capability_grants" TO "service_role";

REVOKE ALL ON TABLE "public"."crew_roles" FROM "anon";
REVOKE ALL ON TABLE "public"."role_capability_grants" FROM "anon";
REVOKE ALL ON TABLE "public"."user_capability_grants" FROM "anon";
-- A grant is an audit record; it is revoked (revoked_at), not deleted.
REVOKE DELETE ON TABLE "public"."user_capability_grants" FROM "authenticated";

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Backfill the catalog from the free text we have.
--
-- Slugify crew_members.role → crew_roles, keeping the original as the display
-- name. Conservative on purpose: this DEDUPES ONLY EXACT SLUG MATCHES. It will
-- NOT merge 'Stage Manager' with 'Stage Manager — cosmicMEADOW' — those are
-- plausibly the same job, but deciding that is a human call about an org's
-- operations, and silently merging two roles would silently merge their
-- permissions. Operators merge them in the admin surface.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO "public"."crew_roles" ("org_id", "slug", "name")
SELECT DISTINCT ON (cm."org_id", "public"."slugify_role"(cm."role"))
  cm."org_id",
  "public"."slugify_role"(cm."role"),
  cm."role"
FROM "public"."crew_members" cm
WHERE cm."role" IS NOT NULL
  AND "public"."slugify_role"(cm."role") <> ''
ON CONFLICT DO NOTHING;

UPDATE "public"."crew_members" cm
SET "crew_role_id" = cr."id"
FROM "public"."crew_roles" cr
WHERE cr."org_id" = cm."org_id"
  AND cr."slug" = "public"."slugify_role"(cm."role")
  AND cm."role" IS NOT NULL
  AND cm."crew_role_id" IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- NOT BUILT YET, on purpose: shift-derived grants.
--
-- `shifts` already has the right shape (role, starts_at, ends_at,
-- workforce_member_id) — but live data has 0 shifts with a role, 0 with a
-- workforce_member_id, and workforce_members has 0 rows with a user_id. There
-- is nothing to derive from. `shift_derivable` is recorded now so the intent
-- survives; the resolver reads it when rostering carries real data.
-- Until then, cover shifts use a time-boxed user_capability_grant, which does
-- the same job with an explicit, attributable actor.
-- ─────────────────────────────────────────────────────────────────────────────
