-- Hot-path FK indexes for the 0046–0049 tables.
-- Each index covers a foreign-key column that's a join target on a
-- common access pattern. The migration is idempotent (IF NOT EXISTS).

-- announcements
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON "public"."announcements"(author_id) WHERE author_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_announcements_project_id ON "public"."announcements"(project_id) WHERE project_id IS NOT NULL;

-- badge_awards
CREATE INDEX IF NOT EXISTS idx_badge_awards_badge_id ON "public"."badge_awards"(badge_id);
CREATE INDEX IF NOT EXISTS idx_badge_awards_awarded_by ON "public"."badge_awards"(awarded_by) WHERE awarded_by IS NOT NULL;

-- chat
CREATE INDEX IF NOT EXISTS idx_chat_messages_author_id ON "public"."chat_messages"(author_id) WHERE author_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON "public"."chat_rooms"(created_by) WHERE created_by IS NOT NULL;

-- courses
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON "public"."courses"(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_course_assignments_assigned_by ON "public"."course_assignments"(assigned_by) WHERE assigned_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_course_quiz_questions_lesson_id ON "public"."course_quiz_questions"(lesson_id) WHERE lesson_id IS NOT NULL;

-- new-hire flows
CREATE INDEX IF NOT EXISTS idx_new_hire_assignments_org_id ON "public"."new_hire_assignments"(org_id);

-- personal documents
CREATE INDEX IF NOT EXISTS idx_personal_documents_org_id ON "public"."personal_documents"(org_id);

-- polls
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON "public"."polls"(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_poll_votes_option_id ON "public"."poll_votes"(option_id);

-- recognition
CREATE INDEX IF NOT EXISTS idx_recognition_posts_from_user_id ON "public"."recognition_posts"(from_user_id);

-- shift swaps
CREATE INDEX IF NOT EXISTS idx_shift_swaps_requested_by ON "public"."shift_swaps"(requested_by);
CREATE INDEX IF NOT EXISTS idx_shift_swaps_target_user_id ON "public"."shift_swaps"(target_user_id) WHERE target_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shift_swaps_decided_by ON "public"."shift_swaps"(decided_by) WHERE decided_by IS NOT NULL;

-- surveys
CREATE INDEX IF NOT EXISTS idx_surveys_created_by ON "public"."surveys"(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_survey_responses_respondent_id ON "public"."survey_responses"(respondent_id) WHERE respondent_id IS NOT NULL;

-- time off
CREATE INDEX IF NOT EXISTS idx_time_off_balances_org_id ON "public"."time_off_balances"(org_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_policy_id ON "public"."time_off_requests"(policy_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_decided_by ON "public"."time_off_requests"(decided_by) WHERE decided_by IS NOT NULL;
