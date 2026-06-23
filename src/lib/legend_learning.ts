/**
 * LEG3ND learning spine vocabulary — courses → lessons → enrollments →
 * assessments → attempts. Enum tuples `as const` → derived types → label
 * maps + pure helpers. Backed by migration 20260623150010_legend_learning_lms.
 */

// ── Course ─────────────────────────────────────────────────────────────
export const COURSE_STATES = ["draft", "published", "archived"] as const;
export type CourseState = (typeof COURSE_STATES)[number];
export const COURSE_STATE_LABELS: Record<CourseState, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

// ── Lesson ─────────────────────────────────────────────────────────────
export const LESSON_KINDS = ["video", "audio", "article"] as const;
export type LessonKind = (typeof LESSON_KINDS)[number];
export const LESSON_KIND_LABELS: Record<LessonKind, string> = {
  video: "Video",
  audio: "Audio",
  article: "Article",
};

// ── Enrollment ─────────────────────────────────────────────────────────
export const ENROLLMENT_STATES = ["enrolled", "in_progress", "completed", "expired"] as const;
export type EnrollmentState = (typeof ENROLLMENT_STATES)[number];
export const ENROLLMENT_STATE_LABELS: Record<EnrollmentState, string> = {
  enrolled: "Enrolled",
  in_progress: "In progress",
  completed: "Completed",
  expired: "Expired",
};

// ── Lesson progress ────────────────────────────────────────────────────
export const PROGRESS_STATES = ["not_started", "in_progress", "completed"] as const;
export type ProgressState = (typeof PROGRESS_STATES)[number];

// ── Assessment / attempt ───────────────────────────────────────────────
export const ASSESSMENT_STATES = ["draft", "published", "archived"] as const;
export type AssessmentState = (typeof ASSESSMENT_STATES)[number];
export const ATTEMPT_STATES = ["in_progress", "submitted", "passed", "failed"] as const;
export type AttemptState = (typeof ATTEMPT_STATES)[number];

// ── Row shapes (hand-written until types regen — LooseSupabase reads) ──
export type Course = {
  id: string;
  org_id: string;
  title: string;
  summary: string | null;
  cover_path: string | null;
  points_reward: number;
  grants_certification_id: string | null;
  course_state: CourseState;
  created_at: string;
  updated_at: string;
};

export type Lesson = {
  id: string;
  org_id: string;
  course_id: string;
  module_id: string | null;
  title: string;
  kind: LessonKind;
  media_url: string | null;
  body_html: string | null;
  duration_seconds: number;
  sort_order: number;
  lesson_state: LessonState;
};

export const LESSON_STATES = ["draft", "published", "archived"] as const;
export type LessonState = (typeof LESSON_STATES)[number];

export type CourseEnrollment = {
  id: string;
  org_id: string;
  course_id: string;
  user_id: string;
  enrollment_state: EnrollmentState;
  progress_pct: number;
  completed_at: string | null;
};

export type AssessmentQuestion = {
  id: string;
  org_id: string;
  assessment_id: string;
  prompt: string;
  options: string[];
  correct_index: number;
  points: number;
  sort_order: number;
};

export type Assessment = {
  id: string;
  org_id: string;
  course_id: string | null;
  lesson_id: string | null;
  title: string;
  pass_pct: number;
  max_attempts: number | null;
  assessment_state: AssessmentState;
};

// ── Pure helpers ───────────────────────────────────────────────────────

/** Score an assessment attempt: index-of-answer per question vs. correct_index. */
export function scoreAttempt(
  questions: Array<Pick<AssessmentQuestion, "correct_index" | "points">>,
  answers: number[],
): { scorePct: number; earned: number; total: number } {
  const total = questions.reduce((s, q) => s + q.points, 0);
  const earned = questions.reduce((s, q, i) => (answers[i] === q.correct_index ? s + q.points : s), 0);
  const scorePct = total === 0 ? 0 : Math.round((earned / total) * 100);
  return { scorePct, earned, total };
}

/** Format seconds → "12m", "1h 04m". */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${String(m % 60).padStart(2, "0")}m`;
}

/** The fixed four stages of the learning arc, for the <Steps> spine. */
export const LEARNING_ARC = ["Learn", "Assess", "Certify", "Recert"] as const;
export type LearningStage = (typeof LEARNING_ARC)[number];

/** A learner's enrollment joined to its course title, for My Learning / Progress. */
export type EnrollmentWithCourse = CourseEnrollment & { course_title: string };

/** Roll up a learner's enrollments into headline stats. */
export function summarizeEnrollments(
  enrollments: ReadonlyArray<Pick<CourseEnrollment, "enrollment_state" | "progress_pct">>,
): { enrolled: number; inProgress: number; completed: number; avgProgress: number } {
  const enrolled = enrollments.length;
  const completed = enrollments.filter((e) => e.enrollment_state === "completed").length;
  const inProgress = enrollments.filter((e) => e.enrollment_state === "in_progress").length;
  const avgProgress =
    enrolled === 0 ? 0 : Math.round(enrollments.reduce((s, e) => s + (e.progress_pct ?? 0), 0) / enrolled);
  return { enrolled, inProgress, completed, avgProgress };
}

/** Pass rate from a set of assessment attempts (passed / submitted), 0–100. */
export function passRate(attempts: ReadonlyArray<{ passed: boolean; attempt_state: AttemptState }>): number {
  const decided = attempts.filter((a) => a.attempt_state === "passed" || a.attempt_state === "failed");
  if (decided.length === 0) return 0;
  return Math.round((decided.filter((a) => a.passed).length / decided.length) * 100);
}
