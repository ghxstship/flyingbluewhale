-- LEG3ND badge earn path (readiness SHOULD S-1).
--
-- `achievement_awards` had no writer anywhere in the app — the /legend/badges
-- gallery rendered an earned state that could never occur outside seed rows.
-- The gamification schema models an org-defined achievement catalog but no
-- structural link from anything earnable to an achievement. This adds the one
-- link the learning spine needs, mirroring the workforce-parity precedent
-- (`courses.completion_badge_id`, 0048) on the LEG3ND course table:
--
--   legend_courses.completion_achievement_id → achievements(id)
--
-- The award write happens app-side at the completion recording site
-- (completeLessonAction, src/app/(legend)/legend/learn/actions.ts), idempotent
-- on the existing unique (org_id, achievement_id, user_id) key of
-- `achievement_awards`.
--
-- CODE-READY migration — authored in-tree, NOT applied here. The operator
-- applies it, then regenerates database.types.ts.

alter table public.legend_courses
  add column completion_achievement_id uuid references public.achievements(id) on delete set null;

comment on column public.legend_courses.completion_achievement_id is
  'Achievement awarded (once per user, idempotent) when a learner completes every published lesson of this course';

-- FK-index canon: every new FK gets a covering index (2026-07-17 FK audit).
create index legend_courses_completion_achievement_idx
  on public.legend_courses (completion_achievement_id)
  where completion_achievement_id is not null;
