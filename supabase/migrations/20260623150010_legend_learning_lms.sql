-- LEG3ND learning spine — courses → modules → lessons → enrollments →
-- lesson progress → assessments → attempts. The learn→assess half of the
-- learn→assess→certify→recert arc (certify/recert live in the next
-- migration). 3NF, org-scoped, RLS. LDP naming: `*_state` (cyclical).
--
-- Table names `legend_courses` / (and `legend_certifications` in the next
-- migration) are LEG3ND-prefixed to avoid colliding with the pre-existing
-- Connecteam workforce-training `courses` / baseline `certifications` tables.
-- LEG3ND is the canonical learning/LMS owner.

-- ── Courses ────────────────────────────────────────────────────────────
create table public.legend_courses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  title text not null,
  summary text,
  cover_path text,
  points_reward integer not null default 0 check (points_reward >= 0),
  -- the certification granted on completion (FK added in the certifications
  -- migration, which runs after this one).
  grants_certification_id uuid,
  course_state text not null default 'draft' check (course_state in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index courses_org_idx on public.legend_courses (org_id, course_state) where deleted_at is null;

alter table public.legend_courses enable row level security;
create policy courses_select on public.legend_courses
  for select using (private.is_org_member(org_id));
create policy courses_write on public.legend_courses
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']));
create trigger trg_courses_updated before update on public.legend_courses
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.legend_courses to authenticated;

-- ── Course modules ─────────────────────────────────────────────────────
create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  course_id uuid not null references public.legend_courses(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index course_modules_course_idx on public.course_modules (org_id, course_id, sort_order);

alter table public.course_modules enable row level security;
create policy course_modules_select on public.course_modules
  for select using (private.is_org_member(org_id));
create policy course_modules_write on public.course_modules
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']));
create trigger trg_course_modules_updated before update on public.course_modules
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.course_modules to authenticated;

-- ── Lessons ────────────────────────────────────────────────────────────
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  course_id uuid not null references public.legend_courses(id) on delete cascade,
  module_id uuid references public.course_modules(id) on delete set null,
  title text not null,
  kind text not null default 'article' check (kind in ('video', 'audio', 'article')),
  media_url text,
  body_html text,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  sort_order integer not null default 0,
  lesson_state text not null default 'draft' check (lesson_state in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index lessons_course_idx on public.lessons (org_id, course_id, sort_order) where deleted_at is null;

alter table public.lessons enable row level security;
create policy lessons_select on public.lessons
  for select using (private.is_org_member(org_id));
create policy lessons_write on public.lessons
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']));
create trigger trg_lessons_updated before update on public.lessons
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.lessons to authenticated;

-- ── Course enrollments (one per learner per course) ────────────────────
create table public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  course_id uuid not null references public.legend_courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  enrollment_state text not null default 'enrolled' check (enrollment_state in ('enrolled', 'in_progress', 'completed', 'expired')),
  progress_pct integer not null default 0 check (progress_pct between 0 and 100),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, course_id, user_id)
);
create index course_enrollments_user_idx on public.course_enrollments (org_id, user_id, enrollment_state);

alter table public.course_enrollments enable row level security;
create policy course_enrollments_select on public.course_enrollments
  for select using (private.is_org_member(org_id) and (user_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin', 'controller'])));
create policy course_enrollments_insert on public.course_enrollments
  for insert with check (private.is_org_member(org_id) and user_id = auth.uid());
create policy course_enrollments_update on public.course_enrollments
  for update using (user_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin', 'controller']))
  with check (user_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin', 'controller']));
create trigger trg_course_enrollments_updated before update on public.course_enrollments
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.course_enrollments to authenticated;

-- ── Lesson progress (one per learner per lesson) ───────────────────────
create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  enrollment_id uuid not null references public.course_enrollments(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  progress_state text not null default 'not_started' check (progress_state in ('not_started', 'in_progress', 'completed')),
  position_seconds integer not null default 0 check (position_seconds >= 0),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (enrollment_id, lesson_id)
);
create index lesson_progress_user_idx on public.lesson_progress (org_id, user_id, lesson_id);

alter table public.lesson_progress enable row level security;
create policy lesson_progress_select on public.lesson_progress
  for select using (private.is_org_member(org_id) and (user_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin', 'controller'])));
create policy lesson_progress_insert on public.lesson_progress
  for insert with check (private.is_org_member(org_id) and user_id = auth.uid());
create policy lesson_progress_update on public.lesson_progress
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());
create trigger trg_lesson_progress_updated before update on public.lesson_progress
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.lesson_progress to authenticated;

-- ── Assessments ────────────────────────────────────────────────────────
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  course_id uuid references public.legend_courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  title text not null,
  pass_pct integer not null default 70 check (pass_pct between 0 and 100),
  max_attempts integer check (max_attempts is null or max_attempts > 0),
  assessment_state text not null default 'draft' check (assessment_state in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index assessments_course_idx on public.assessments (org_id, course_id) where deleted_at is null;

alter table public.assessments enable row level security;
create policy assessments_select on public.assessments
  for select using (private.is_org_member(org_id));
create policy assessments_write on public.assessments
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']));
create trigger trg_assessments_updated before update on public.assessments
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.assessments to authenticated;

-- ── Assessment questions ───────────────────────────────────────────────
create table public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  correct_index integer not null default 0 check (correct_index >= 0),
  points integer not null default 1 check (points > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index assessment_questions_idx on public.assessment_questions (org_id, assessment_id, sort_order);

alter table public.assessment_questions enable row level security;
create policy assessment_questions_select on public.assessment_questions
  for select using (private.is_org_member(org_id));
create policy assessment_questions_write on public.assessment_questions
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller', 'collaborator']));
create trigger trg_assessment_questions_updated before update on public.assessment_questions
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.assessment_questions to authenticated;

-- ── Assessment attempts ────────────────────────────────────────────────
create table public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score_pct integer not null default 0 check (score_pct between 0 and 100),
  passed boolean not null default false,
  answers jsonb not null default '[]'::jsonb,
  attempt_state text not null default 'in_progress' check (attempt_state in ('in_progress', 'submitted', 'passed', 'failed')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz
);
create index assessment_attempts_user_idx on public.assessment_attempts (org_id, user_id, assessment_id, started_at desc);

alter table public.assessment_attempts enable row level security;
create policy assessment_attempts_select on public.assessment_attempts
  for select using (private.is_org_member(org_id) and (user_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin', 'controller'])));
create policy assessment_attempts_insert on public.assessment_attempts
  for insert with check (private.is_org_member(org_id) and user_id = auth.uid());
create policy assessment_attempts_update on public.assessment_attempts
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());
grant select, insert, update, delete on public.assessment_attempts to authenticated;
