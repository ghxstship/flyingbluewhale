/**
 * LEG3ND authoring (teach) vocabulary — the supply side of the learning
 * spine. Pure lifecycle maps + guards for course / lesson / assessment /
 * live-session authoring (PERSONA_MATRIX blockers B-1 + B-2).
 *
 * LDP: `course_state` / `lesson_state` / `assessment_state` /
 * `session_state` are cyclical `*_state` columns; the allowed transitions
 * are codified here and enforced server-side in the teach actions so a
 * stale tab can't write an illegal jump. Publish carries HONEST guards:
 * a course cannot publish without at least one published lesson, an
 * assessment cannot publish without at least one question — so learners
 * never land on a published-but-empty surface.
 *
 * Unit-tested in src/lib/legend_teach.test.ts.
 */
import type { AssessmentState, CourseState, LessonState } from "@/lib/legend_learning";
import type { SessionState } from "@/lib/legend_live";

// ── Content lifecycle (draft → published → archived, restorable) ───────
export const NEXT_COURSE_STATES: Record<CourseState, readonly CourseState[]> = {
  draft: ["published", "archived"],
  published: ["draft", "archived"],
  archived: ["draft"],
};

export const NEXT_LESSON_STATES: Record<LessonState, readonly LessonState[]> = {
  draft: ["published", "archived"],
  published: ["draft", "archived"],
  archived: ["draft"],
};

export const NEXT_ASSESSMENT_STATES: Record<AssessmentState, readonly AssessmentState[]> = {
  draft: ["published", "archived"],
  published: ["draft", "archived"],
  archived: ["draft"],
};

// ── Live-session lifecycle (forward-only; cancel is terminal) ──────────
export const NEXT_SESSION_STATES: Record<SessionState, readonly SessionState[]> = {
  scheduled: ["live", "cancelled"],
  live: ["ended", "cancelled"],
  ended: [],
  cancelled: [],
};

/** True when `next` is a legal transition from `current`. */
export function canTransition<S extends string>(map: Record<S, readonly S[]>, current: S, next: S): boolean {
  return (map[current] ?? []).includes(next);
}

/**
 * Publish guard — a course may only go live once at least one of its
 * lessons is itself published (the learner course page renders published
 * lessons only, so anything less publishes an empty course).
 */
export function canPublishCourse(publishedLessonCount: number): boolean {
  return publishedLessonCount >= 1;
}

/** Publish guard — an assessment needs at least one question to score. */
export function canPublishAssessment(questionCount: number): boolean {
  return questionCount >= 1;
}

// ── Ordering (up/down reorder, no drag dependency) ─────────────────────
export type Sortable = { id: string; sort_order: number };

/**
 * Compute the sort_order swap for moving `id` one step up or down within
 * `items` (assumed pre-sorted by sort_order, ties broken upstream).
 * Returns the two rows to write, or null when the move is a no-op (top /
 * bottom edge, or unknown id). Equal sort_order values (legacy seeds all
 * defaulted to 0) are normalized by writing the items' INDEX positions,
 * so a first move on a tied list still produces a stable order.
 */
export function neighborSwap(
  items: readonly Sortable[],
  id: string,
  direction: "up" | "down",
): Array<{ id: string; sort_order: number }> | null {
  const idx = items.findIndex((item) => item.id === id);
  if (idx === -1) return null;
  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= items.length) return null;
  const a = items[idx]!;
  const b = items[targetIdx]!;
  // Tie-safe: swap the INDEX positions, not the (possibly equal) stored values.
  return [
    { id: a.id, sort_order: targetIdx },
    { id: b.id, sort_order: idx },
  ];
}

// ── Question options ───────────────────────────────────────────────────
/** Parse the one-option-per-line textarea into a trimmed options array. */
export function parseOptionLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
