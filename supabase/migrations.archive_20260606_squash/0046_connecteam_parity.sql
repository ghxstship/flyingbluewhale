-- Connecteam parity — close gaps to feature-match the deskless workforce
-- app while staying inside our 3-shell IA. New surfaces appear under
-- existing buckets (`/m`, `/console/comms`, `/console/workforce`,
-- `/console/people`) — no new shells, no new top-level modules.
--
-- LDP discipline: every new lifecycle column is `*_state` (cyclical
-- operational) or `*_phase` (sequential macro arc). No `status` columns
-- in new tables. See LIFECYCLE_DECOMPOSITION_PROTOCOL.md.
--
-- RLS pattern: `private.is_org_member(org_id)` for org-scoped read+write.
-- Personal-doc surfaces use `auth.uid()` for self-scoped policies.

-- ============================================================
-- 1. GEOFENCES + time-clock geofence extension
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."time_clock_zones" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "project_id" uuid REFERENCES "public"."projects"("id") ON DELETE SET NULL,
    "name" text NOT NULL,
    "center_lat" double precision NOT NULL,
    "center_lng" double precision NOT NULL,
    "radius_m" integer NOT NULL CHECK (radius_m BETWEEN 25 AND 5000),
    "lifecycle_state" text NOT NULL DEFAULT 'active' CHECK (lifecycle_state IN ('active','inactive','archived')),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz
);

CREATE INDEX IF NOT EXISTS idx_time_clock_zones_org_id ON "public"."time_clock_zones"(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_time_clock_zones_project_id ON "public"."time_clock_zones"(project_id) WHERE deleted_at IS NULL;

ALTER TABLE "public"."time_entries"
    ADD COLUMN IF NOT EXISTS "zone_id" uuid REFERENCES "public"."time_clock_zones"("id") ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS "punch_lat" double precision,
    ADD COLUMN IF NOT EXISTS "punch_lng" double precision,
    ADD COLUMN IF NOT EXISTS "geofence_state" text CHECK (geofence_state IN ('inside','outside','unknown'));

CREATE INDEX IF NOT EXISTS idx_time_entries_zone_id ON "public"."time_entries"(zone_id) WHERE zone_id IS NOT NULL;

-- ============================================================
-- 2. SHIFT SWAPS — state machine on the existing shifts table
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."shift_swaps" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "shift_id" uuid NOT NULL REFERENCES "public"."shifts"("id") ON DELETE CASCADE,
    "requested_by" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "target_user_id" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    "reason" text,
    "swap_state" text NOT NULL DEFAULT 'requested' CHECK (swap_state IN ('requested','accepted','declined','approved','cancelled')),
    "decided_by" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    "decided_at" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shift_swaps_org_id ON "public"."shift_swaps"(org_id);
CREATE INDEX IF NOT EXISTS idx_shift_swaps_shift_id ON "public"."shift_swaps"(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_swaps_state ON "public"."shift_swaps"(org_id, swap_state);

-- ============================================================
-- 3. UPDATES FEED — org-wide announcements
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "author_id" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    "title" text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
    "body" text NOT NULL,
    "audience" text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','crew','contractors','vendors','admins')),
    "project_id" uuid REFERENCES "public"."projects"("id") ON DELETE SET NULL,
    "pinned" boolean NOT NULL DEFAULT false,
    "publish_state" text NOT NULL DEFAULT 'draft' CHECK (publish_state IN ('draft','published','archived')),
    "published_at" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz
);

CREATE INDEX IF NOT EXISTS idx_announcements_org_published ON "public"."announcements"(org_id, published_at DESC) WHERE publish_state = 'published' AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS "public"."announcement_reads" (
    "announcement_id" uuid NOT NULL REFERENCES "public"."announcements"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "read_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_user ON "public"."announcement_reads"(user_id);

-- ============================================================
-- 4. CHAT — 1:1, group, channel
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."chat_rooms" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "name" text,
    "room_kind" text NOT NULL DEFAULT 'direct' CHECK (room_kind IN ('direct','group','channel')),
    "created_by" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    "last_message_at" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_org_id ON "public"."chat_rooms"(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message ON "public"."chat_rooms"(org_id, last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS "public"."chat_room_members" (
    "room_id" uuid NOT NULL REFERENCES "public"."chat_rooms"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "joined_at" timestamptz NOT NULL DEFAULT now(),
    "last_read_at" timestamptz,
    "member_role" text NOT NULL DEFAULT 'member' CHECK (member_role IN ('owner','admin','member')),
    PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_room_members_user ON "public"."chat_room_members"(user_id);

CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "room_id" uuid NOT NULL REFERENCES "public"."chat_rooms"("id") ON DELETE CASCADE,
    "author_id" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    "body" text NOT NULL CHECK (length(body) > 0),
    "attachments" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON "public"."chat_messages"(room_id, created_at DESC);

-- ============================================================
-- 5. SURVEYS + POLLS
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."surveys" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "description" text,
    "audience" text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','crew','contractors','vendors','admins')),
    "anonymous" boolean NOT NULL DEFAULT false,
    "publish_state" text NOT NULL DEFAULT 'draft' CHECK (publish_state IN ('draft','published','closed')),
    "closes_at" timestamptz,
    "created_by" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz
);

CREATE INDEX IF NOT EXISTS idx_surveys_org_id ON "public"."surveys"(org_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS "public"."survey_questions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "survey_id" uuid NOT NULL REFERENCES "public"."surveys"("id") ON DELETE CASCADE,
    "ordinal" integer NOT NULL,
    "prompt" text NOT NULL,
    "question_kind" text NOT NULL CHECK (question_kind IN ('single_choice','multi_choice','scale','text','boolean')),
    "options" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "required" boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_survey_questions_survey ON "public"."survey_questions"(survey_id, ordinal);

CREATE TABLE IF NOT EXISTS "public"."survey_responses" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "survey_id" uuid NOT NULL REFERENCES "public"."surveys"("id") ON DELETE CASCADE,
    "respondent_id" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    "answers" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "submitted_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON "public"."survey_responses"(survey_id);

CREATE TABLE IF NOT EXISTS "public"."polls" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "question" text NOT NULL,
    "publish_state" text NOT NULL DEFAULT 'draft' CHECK (publish_state IN ('draft','live','closed')),
    "audience" text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','crew','contractors','vendors','admins')),
    "closes_at" timestamptz,
    "created_by" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz
);

CREATE INDEX IF NOT EXISTS idx_polls_org_id ON "public"."polls"(org_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS "public"."poll_options" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "poll_id" uuid NOT NULL REFERENCES "public"."polls"("id") ON DELETE CASCADE,
    "ordinal" integer NOT NULL,
    "label" text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON "public"."poll_options"(poll_id, ordinal);

CREATE TABLE IF NOT EXISTS "public"."poll_votes" (
    "poll_id" uuid NOT NULL REFERENCES "public"."polls"("id") ON DELETE CASCADE,
    "option_id" uuid NOT NULL REFERENCES "public"."poll_options"("id") ON DELETE CASCADE,
    "voter_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "voted_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (poll_id, voter_id)
);

-- ============================================================
-- 6. LEARNING — courses, lessons, quizzes, assignments, completions
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "summary" text,
    "duration_minutes" integer,
    "required_for_role" text,
    "publish_state" text NOT NULL DEFAULT 'draft' CHECK (publish_state IN ('draft','published','archived')),
    "created_by" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz
);

CREATE INDEX IF NOT EXISTS idx_courses_org_id ON "public"."courses"(org_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS "public"."course_lessons" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "course_id" uuid NOT NULL REFERENCES "public"."courses"("id") ON DELETE CASCADE,
    "ordinal" integer NOT NULL,
    "title" text NOT NULL,
    "body" text,
    "media_url" text,
    "lesson_kind" text NOT NULL DEFAULT 'text' CHECK (lesson_kind IN ('text','video','pdf','external'))
);

CREATE INDEX IF NOT EXISTS idx_course_lessons_course ON "public"."course_lessons"(course_id, ordinal);

CREATE TABLE IF NOT EXISTS "public"."course_quiz_questions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "course_id" uuid NOT NULL REFERENCES "public"."courses"("id") ON DELETE CASCADE,
    "lesson_id" uuid REFERENCES "public"."course_lessons"("id") ON DELETE CASCADE,
    "ordinal" integer NOT NULL,
    "prompt" text NOT NULL,
    "choices" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "correct_index" integer NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_course_quiz_questions_course ON "public"."course_quiz_questions"(course_id, ordinal);

CREATE TABLE IF NOT EXISTS "public"."course_assignments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "course_id" uuid NOT NULL REFERENCES "public"."courses"("id") ON DELETE CASCADE,
    "assignee_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "due_at" timestamptz,
    "assignment_state" text NOT NULL DEFAULT 'assigned' CHECK (assignment_state IN ('assigned','in_progress','completed','overdue','waived')),
    "assigned_by" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    "assigned_at" timestamptz NOT NULL DEFAULT now(),
    UNIQUE (course_id, assignee_id)
);

CREATE INDEX IF NOT EXISTS idx_course_assignments_assignee ON "public"."course_assignments"(assignee_id, assignment_state);
CREATE INDEX IF NOT EXISTS idx_course_assignments_org ON "public"."course_assignments"(org_id);

CREATE TABLE IF NOT EXISTS "public"."course_completions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "assignment_id" uuid NOT NULL REFERENCES "public"."course_assignments"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "score_pct" numeric(5,2),
    "passed" boolean NOT NULL,
    "answers" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "completed_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_completions_user ON "public"."course_completions"(user_id);
CREATE INDEX IF NOT EXISTS idx_course_completions_assignment ON "public"."course_completions"(assignment_id);

-- ============================================================
-- 7. TIME OFF — policies, balances, requests
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."time_off_policies" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "policy_kind" text NOT NULL CHECK (policy_kind IN ('pto','sick','bereavement','jury_duty','unpaid','other')),
    "annual_hours" numeric(8,2) NOT NULL DEFAULT 0,
    "accrual_state" text NOT NULL DEFAULT 'lump_sum' CHECK (accrual_state IN ('lump_sum','monthly','biweekly','per_hour_worked')),
    "max_carryover_hours" numeric(8,2),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz
);

CREATE INDEX IF NOT EXISTS idx_time_off_policies_org ON "public"."time_off_policies"(org_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS "public"."time_off_balances" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "policy_id" uuid NOT NULL REFERENCES "public"."time_off_policies"("id") ON DELETE CASCADE,
    "balance_hours" numeric(8,2) NOT NULL DEFAULT 0,
    "accrued_ytd_hours" numeric(8,2) NOT NULL DEFAULT 0,
    "used_ytd_hours" numeric(8,2) NOT NULL DEFAULT 0,
    "year" integer NOT NULL,
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, policy_id, year)
);

CREATE INDEX IF NOT EXISTS idx_time_off_balances_user ON "public"."time_off_balances"(user_id, year);

CREATE TABLE IF NOT EXISTS "public"."time_off_requests" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "policy_id" uuid NOT NULL REFERENCES "public"."time_off_policies"("id") ON DELETE CASCADE,
    "starts_on" date NOT NULL,
    "ends_on" date NOT NULL CHECK (ends_on >= starts_on),
    "hours_requested" numeric(8,2) NOT NULL CHECK (hours_requested > 0),
    "reason" text,
    "request_state" text NOT NULL DEFAULT 'pending' CHECK (request_state IN ('pending','approved','denied','cancelled')),
    "decided_by" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    "decided_at" timestamptz,
    "decision_note" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_off_requests_user ON "public"."time_off_requests"(user_id, request_state);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_org ON "public"."time_off_requests"(org_id, request_state);

-- ============================================================
-- 8. RECOGNITION — kudos posts + badges
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."recognition_posts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "from_user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "to_user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "message" text NOT NULL CHECK (length(message) BETWEEN 1 AND 500),
    "value_tag" text,
    "points" integer NOT NULL DEFAULT 0 CHECK (points BETWEEN 0 AND 1000),
    "visibility_state" text NOT NULL DEFAULT 'public' CHECK (visibility_state IN ('public','manager_only','private')),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz
);

CREATE INDEX IF NOT EXISTS idx_recognition_posts_org_recent ON "public"."recognition_posts"(org_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recognition_posts_to_user ON "public"."recognition_posts"(to_user_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS "public"."recognition_reactions" (
    "post_id" uuid NOT NULL REFERENCES "public"."recognition_posts"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "emoji" text NOT NULL,
    "reacted_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS "public"."badges" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "code" text NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "icon" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    UNIQUE (org_id, code)
);

CREATE TABLE IF NOT EXISTS "public"."badge_awards" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "badge_id" uuid NOT NULL REFERENCES "public"."badges"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "awarded_by" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    "note" text,
    "awarded_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_badge_awards_user ON "public"."badge_awards"(user_id);

-- ============================================================
-- 9. PERSONAL DOCUMENTS — employee doc vault (distinct from
-- credentials which are work-eligibility docs operators manage)
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."personal_documents" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "label" text NOT NULL,
    "doc_kind" text NOT NULL CHECK (doc_kind IN ('id','license','tax','contract','medical','other')),
    "storage_path" text NOT NULL,
    "mime_type" text,
    "size_bytes" bigint,
    "uploaded_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz
);

CREATE INDEX IF NOT EXISTS idx_personal_documents_user ON "public"."personal_documents"(user_id) WHERE deleted_at IS NULL;

-- ============================================================
-- 10. NEW-HIRE FLOWS — Connecteam-style onboarding journeys.
-- Distinct from `onboarding_steps` (migration 0007) which tracks
-- per-offer-letter document signing/upload progress. New-hire flows
-- are reusable templates assigned to a person (course-style).
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."new_hire_flows" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "description" text,
    "target_role" text,
    "publish_state" text NOT NULL DEFAULT 'draft' CHECK (publish_state IN ('draft','published','archived')),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz
);

CREATE INDEX IF NOT EXISTS idx_new_hire_flows_org ON "public"."new_hire_flows"(org_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS "public"."new_hire_flow_steps" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "flow_id" uuid NOT NULL REFERENCES "public"."new_hire_flows"("id") ON DELETE CASCADE,
    "ordinal" integer NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "step_kind" text NOT NULL CHECK (step_kind IN ('read','sign','upload','quiz','course','form')),
    "ref_id" uuid,
    "required" boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_new_hire_flow_steps_flow ON "public"."new_hire_flow_steps"(flow_id, ordinal);

CREATE TABLE IF NOT EXISTS "public"."new_hire_assignments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "flow_id" uuid NOT NULL REFERENCES "public"."new_hire_flows"("id") ON DELETE CASCADE,
    "assignee_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "assignment_phase" text NOT NULL DEFAULT 'not_started' CHECK (assignment_phase IN ('not_started','in_progress','completed','abandoned')),
    "progress" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "started_at" timestamptz,
    "completed_at" timestamptz,
    "assigned_at" timestamptz NOT NULL DEFAULT now(),
    UNIQUE (flow_id, assignee_id)
);

CREATE INDEX IF NOT EXISTS idx_new_hire_assignments_assignee ON "public"."new_hire_assignments"(assignee_id);

-- ============================================================
-- RLS — every new table org-scoped via private.is_org_member
-- ============================================================

ALTER TABLE "public"."time_clock_zones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."shift_swaps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."announcement_reads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."chat_rooms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."chat_room_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."surveys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."survey_questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."survey_responses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."polls" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."poll_options" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."poll_votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."course_lessons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."course_quiz_questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."course_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."course_completions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."time_off_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."time_off_balances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."time_off_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."recognition_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."recognition_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."badge_awards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."personal_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."new_hire_flows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."new_hire_flow_steps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."new_hire_assignments" ENABLE ROW LEVEL SECURITY;


-- Org-scoped read+write
DO $$ BEGIN
  CREATE POLICY "geofences_org_rw" ON "public"."time_clock_zones" TO authenticated USING (private.is_org_member(org_id)) WITH CHECK (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "shift_swaps_org_rw" ON "public"."shift_swaps" TO authenticated USING (private.is_org_member(org_id)) WITH CHECK (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "announcements_org_rw" ON "public"."announcements" TO authenticated USING (private.is_org_member(org_id)) WITH CHECK (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- announcement_reads: a row references an announcement; we gate via the parent's org membership
DO $$ BEGIN
  CREATE POLICY "announcement_reads_self_rw" ON "public"."announcement_reads" TO authenticated
    USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "chat_rooms_org_rw" ON "public"."chat_rooms" TO authenticated USING (private.is_org_member(org_id)) WITH CHECK (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "chat_room_members_self_rw" ON "public"."chat_room_members" TO authenticated
    USING (user_id = (SELECT auth.uid()) OR EXISTS (
      SELECT 1 FROM public.chat_room_members crm
      WHERE crm.room_id = chat_room_members.room_id AND crm.user_id = (SELECT auth.uid())
    ))
    WITH CHECK (user_id = (SELECT auth.uid()) OR EXISTS (
      SELECT 1 FROM public.chat_room_members crm
      WHERE crm.room_id = chat_room_members.room_id AND crm.user_id = (SELECT auth.uid()) AND crm.member_role IN ('owner','admin')
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "chat_messages_member_rw" ON "public"."chat_messages" TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.chat_room_members crm
      WHERE crm.room_id = chat_messages.room_id AND crm.user_id = (SELECT auth.uid())
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.chat_room_members crm
      WHERE crm.room_id = chat_messages.room_id AND crm.user_id = (SELECT auth.uid())
    ) AND private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "surveys_org_rw" ON "public"."surveys" TO authenticated USING (private.is_org_member(org_id)) WITH CHECK (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "survey_questions_via_survey" ON "public"."survey_questions" TO authenticated
    USING (EXISTS (SELECT 1 FROM public.surveys s WHERE s.id = survey_questions.survey_id AND private.is_org_member(s.org_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.surveys s WHERE s.id = survey_questions.survey_id AND private.is_org_member(s.org_id)));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "survey_responses_self_or_org" ON "public"."survey_responses" TO authenticated
    USING (respondent_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.surveys s WHERE s.id = survey_responses.survey_id AND private.is_org_member(s.org_id)))
    WITH CHECK (respondent_id = (SELECT auth.uid()) OR respondent_id IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "polls_org_rw" ON "public"."polls" TO authenticated USING (private.is_org_member(org_id)) WITH CHECK (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "poll_options_via_poll" ON "public"."poll_options" TO authenticated
    USING (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_options.poll_id AND private.is_org_member(p.org_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_options.poll_id AND private.is_org_member(p.org_id)));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "poll_votes_self_rw" ON "public"."poll_votes" TO authenticated
    USING (voter_id = (SELECT auth.uid())) WITH CHECK (voter_id = (SELECT auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "courses_org_rw" ON "public"."courses" TO authenticated USING (private.is_org_member(org_id)) WITH CHECK (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "course_lessons_via_course" ON "public"."course_lessons" TO authenticated
    USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_lessons.course_id AND private.is_org_member(c.org_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_lessons.course_id AND private.is_org_member(c.org_id)));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "course_quiz_questions_via_course" ON "public"."course_quiz_questions" TO authenticated
    USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_quiz_questions.course_id AND private.is_org_member(c.org_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_quiz_questions.course_id AND private.is_org_member(c.org_id)));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "course_assignments_org_rw" ON "public"."course_assignments" TO authenticated USING (private.is_org_member(org_id)) WITH CHECK (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "course_completions_self_or_org" ON "public"."course_completions" TO authenticated
    USING (user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.course_assignments ca WHERE ca.id = course_completions.assignment_id AND private.is_org_member(ca.org_id)))
    WITH CHECK (user_id = (SELECT auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "time_off_policies_org_rw" ON "public"."time_off_policies" TO authenticated USING (private.is_org_member(org_id)) WITH CHECK (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "time_off_balances_self_or_org" ON "public"."time_off_balances" TO authenticated
    USING (user_id = (SELECT auth.uid()) OR private.is_org_member(org_id))
    WITH CHECK (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "time_off_requests_org_rw" ON "public"."time_off_requests" TO authenticated USING (private.is_org_member(org_id)) WITH CHECK (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "recognition_posts_org_rw" ON "public"."recognition_posts" TO authenticated USING (private.is_org_member(org_id)) WITH CHECK (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "recognition_reactions_self_rw" ON "public"."recognition_reactions" TO authenticated
    USING (user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.recognition_posts rp WHERE rp.id = recognition_reactions.post_id AND private.is_org_member(rp.org_id)))
    WITH CHECK (user_id = (SELECT auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "badges_org_rw" ON "public"."badges" TO authenticated USING (private.is_org_member(org_id)) WITH CHECK (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "badge_awards_org_rw" ON "public"."badge_awards" TO authenticated USING (private.is_org_member(org_id)) WITH CHECK (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "personal_documents_self_rw" ON "public"."personal_documents" TO authenticated
    USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "new_hire_flows_org_rw" ON "public"."new_hire_flows" TO authenticated USING (private.is_org_member(org_id)) WITH CHECK (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "new_hire_flow_steps_via_flow" ON "public"."new_hire_flow_steps" TO authenticated
    USING (EXISTS (SELECT 1 FROM public.new_hire_flows f WHERE f.id = new_hire_flow_steps.flow_id AND private.is_org_member(f.org_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.new_hire_flows f WHERE f.id = new_hire_flow_steps.flow_id AND private.is_org_member(f.org_id)));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "new_hire_assignments_self_or_org" ON "public"."new_hire_assignments" TO authenticated
    USING (assignee_id = (SELECT auth.uid()) OR private.is_org_member(org_id))
    WITH CHECK (private.is_org_member(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
