/**
 * LEG3ND (Knowledge · LMS · Resources) metric resolvers — kit v6.3 Reports engine.
 *
 * Every query is org-scoped. `course_completions` is NOT org-scoped directly
 * (it joins to its org via `course_assignments.org_id` → `courses.org_id`), so
 * we first resolve the org's `course_assignments.id` set and filter completions
 * by `assignment_id IN (...)`. Resolvers return `null` when the source data
 * doesn't exist in the live schema — never a fabricated number.
 */
import type { MetricResolver, ResolverMap } from "./types";
import { countWhere } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDB = any;

/** All `course_assignments.id` for this org (the LMS enrollment set). */
async function orgAssignmentIds(db: AnyDB, orgId: string): Promise<string[] | null> {
  const { data, error } = await db
    .from("course_assignments")
    .select("id")
    .eq("org_id", orgId);
  if (error) return null;
  return (data ?? []).map((r: { id: string }) => r.id);
}

/** Completion rows for the org, joined via the assignment id set. */
async function orgCompletions(
  db: AnyDB,
  orgId: string,
): Promise<Array<{ assignment_id: string | null; score_pct: number | null; passed: boolean | null; completed_at: string | null }> | null> {
  const ids = await orgAssignmentIds(db, orgId);
  if (ids === null) return null;
  if (ids.length === 0) return [];
  const { data, error } = await db
    .from("course_completions")
    .select("assignment_id, score_pct, passed, completed_at")
    .in("assignment_id", ids);
  if (error) return null;
  return data ?? [];
}

const DAY_MS = 1000 * 60 * 60 * 24;

/** course_completion | pct | transcript,syllabus — % of enrolled learners who have a completion row. */
const course_completion: MetricResolver = async (ctx) => {
  const ids = await orgAssignmentIds(ctx.db as AnyDB, ctx.orgId);
  if (ids === null) return null;
  const enrolled = ids.length;
  if (enrolled === 0) return 0;
  const completions = await orgCompletions(ctx.db as AnyDB, ctx.orgId);
  if (completions === null) return null;
  const completedAssignments = new Set(
    completions.filter((c) => c.completed_at != null && c.assignment_id != null).map((c) => c.assignment_id),
  );
  return Math.round((completedAssignments.size / enrolled) * 1000) / 10;
};

/** pass_rate | pct | transcript — passed / total completions. */
const pass_rate: MetricResolver = async (ctx) => {
  const completions = await orgCompletions(ctx.db as AnyDB, ctx.orgId);
  if (completions === null) return null;
  if (completions.length === 0) return 0;
  const passed = completions.filter((c) => c.passed === true).length;
  return Math.round((passed / completions.length) * 1000) / 10;
};

/** ceus_awarded | float | certificate,transcript — no CEU/credit field in the live schema. */
const ceus_awarded: MetricResolver = async () => null;

/** active_certs | int | certificate — credentials not past their expiry (null expiry = non-expiring). */
const active_certs: MetricResolver = async (ctx) => {
  const today = new Date().toISOString().slice(0, 10);
  const { count, error } = await (ctx.db as AnyDB)
    .from("credentials")
    .select("*", { count: "exact", head: true })
    .eq("org_id", ctx.orgId)
    .or(`expires_on.is.null,expires_on.gte.${today}`);
  if (error) return null;
  return count ?? 0;
};

/** expiring_certs | int | certificate — credentials expiring within the next 90 days. */
const expiring_certs: MetricResolver = async (ctx) => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const horizon = new Date(now.getTime() + 90 * DAY_MS).toISOString().slice(0, 10);
  const { count, error } = await (ctx.db as AnyDB)
    .from("credentials")
    .select("*", { count: "exact", head: true })
    .eq("org_id", ctx.orgId)
    .gte("expires_on", today)
    .lte("expires_on", horizon);
  if (error) return null;
  return count ?? 0;
};

/** compliance_rate | pct | transcript,certificate — no compliance linkage between transcript and certificate in schema. */
const compliance_rate: MetricResolver = async () => null;

/** enrollment | int | syllabus — count of LMS course assignments (enrollments) for the org. */
const enrollment: MetricResolver = (ctx) => countWhere(ctx, "course_assignments", {});

/** avg_quiz_score | pct | transcript — mean of completion score_pct. */
const avg_quiz_score: MetricResolver = async (ctx) => {
  const completions = await orgCompletions(ctx.db as AnyDB, ctx.orgId);
  if (completions === null) return null;
  const scores = completions.map((c) => c.score_pct).filter((s): s is number => s != null);
  if (scores.length === 0) return 0;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 10) / 10;
};

/** time_to_complete | days | transcript — avg (completed_at − assigned_at) across completed assignments. */
const time_to_complete: MetricResolver = async (ctx) => {
  const { data: assignments, error: aErr } = await (ctx.db as AnyDB)
    .from("course_assignments")
    .select("id, assigned_at")
    .eq("org_id", ctx.orgId);
  if (aErr) return null;
  const rows = (assignments ?? []) as Array<{ id: string; assigned_at: string | null }>;
  if (rows.length === 0) return 0;
  const assignedAt = new Map(rows.map((r) => [r.id, r.assigned_at]));
  const completions = await orgCompletions(ctx.db as AnyDB, ctx.orgId);
  if (completions === null) return null;
  const durations: number[] = [];
  for (const c of completions) {
    if (!c.completed_at || !c.assignment_id) continue;
    const start = assignedAt.get(c.assignment_id);
    if (!start) continue;
    const days = (new Date(c.completed_at).getTime() - new Date(start).getTime()) / DAY_MS;
    if (Number.isFinite(days) && days >= 0) durations.push(days);
  }
  if (durations.length === 0) return 0;
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  return Math.round(avg * 10) / 10;
};

/** learner_engagement | pct | syllabus — % of enrolled assignments with any completion attempt logged. */
const learner_engagement: MetricResolver = async (ctx) => {
  const ids = await orgAssignmentIds(ctx.db as AnyDB, ctx.orgId);
  if (ids === null) return null;
  if (ids.length === 0) return 0;
  const completions = await orgCompletions(ctx.db as AnyDB, ctx.orgId);
  if (completions === null) return null;
  const engaged = new Set(
    completions.filter((c) => c.assignment_id != null).map((c) => c.assignment_id),
  );
  return Math.round((engaged.size / ids.length) * 1000) / 10;
};

/** content_usage | int | knowledgeBase — count of knowledge-base ("The Standard") articles for the org. */
const content_usage: MetricResolver = (ctx) => countWhere(ctx, "kb_articles", {});

/** catalog_adoption | pct | catalog — no adoption signal on master_catalog_items in the live schema. */
const catalog_adoption: MetricResolver = async () => null;

/** instructor_rating | score | survey,syllabus — survey_responses.answers is freeform jsonb; no structured rating column. */
const instructor_rating: MetricResolver = async () => null;

/** onboarding_ramp | days | transcript,certificate — no onboarding-start anchor distinct from assignment in schema. */
const onboarding_ramp: MetricResolver = async () => null;

export const legendResolvers: ResolverMap = {
  course_completion,
  pass_rate,
  ceus_awarded,
  active_certs,
  expiring_certs,
  compliance_rate,
  enrollment,
  avg_quiz_score,
  time_to_complete,
  learner_engagement,
  content_usage,
  catalog_adoption,
  instructor_rating,
  onboarding_ramp,
};
