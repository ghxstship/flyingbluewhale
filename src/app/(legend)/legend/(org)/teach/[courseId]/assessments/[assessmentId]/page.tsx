import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import type { Assessment, AssessmentQuestion } from "@/lib/legend_learning";
import { NEXT_ASSESSMENT_STATES } from "@/lib/legend_teach";
import { StateActions } from "../../../StateActions";
import { AssessmentForm } from "../../../AssessmentForm";
import {
  deleteAssessmentAction,
  deleteQuestionAction,
  moveQuestionAction,
  setAssessmentStateAction,
  updateAssessmentAction,
} from "../../../actions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * /legend/teach/[courseId]/assessments/[assessmentId] — the assessment
 * builder: settings (pass threshold, attempts), LDP transitions (publish
 * carries the >=1-question guard), and the question bank with answer keys.
 * The learner QuizRunner scores against exactly these rows server-side.
 */
export default async function AssessmentBuilderPage({
  params,
}: {
  params: Promise<{ courseId: string; assessmentId: string }>;
}) {
  const { courseId, assessmentId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;
  const [{ data: course }, { data: assessmentRow }, { data: questionData }] = await Promise.all([
    db
      .from("legend_courses")
      .select("id, title")
      .eq("id", courseId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle(),
    db
      .from("assessments")
      .select("id, org_id, course_id, lesson_id, title, pass_pct, max_attempts, assessment_state")
      .eq("id", assessmentId)
      .eq("course_id", courseId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle(),
    db
      .from("assessment_questions")
      .select("id, org_id, assessment_id, prompt, options, correct_index, points, sort_order")
      .eq("org_id", session.orgId)
      .eq("assessment_id", assessmentId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);
  if (!course || !assessmentRow) notFound();
  const assessment = assessmentRow as Assessment;
  const questions = (questionData ?? []) as AssessmentQuestion[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.teach.assessments.builderEyebrow", undefined, "Assessment Builder")}
        title={assessment.title}
        breadcrumbs={[
          { label: t("console.legend.teach.breadcrumbRoot", undefined, "LEG3ND") },
          { label: t("console.legend.teach.title", undefined, "Teach"), href: "/legend/teach" },
          { label: course.title as string, href: `/legend/teach/${courseId}` },
          { label: assessment.title },
        ]}
        action={
          <DeleteForm
            action={deleteAssessmentAction.bind(null, courseId, assessment.id)}
            confirm={t(
              "console.legend.teach.assessments.deleteConfirm",
              { title: assessment.title },
              `Delete assessment "${assessment.title}"?`,
            )}
          />
        }
      />

      <div className="page-content space-y-8">
        <div className="surface flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={assessment.assessment_state} />
            <span className="text-xs text-[var(--p-text-2)]">
              {assessment.assessment_state === "published"
                ? t("console.legend.teach.assessments.publishedHint", undefined, "Learners see this after finishing the lessons.")
                : t(
                    "console.legend.teach.assessments.draftHint",
                    undefined,
                    "Publish needs at least one question. Answer keys never leave the server.",
                  )}
            </span>
          </div>
          <StateActions
            action={setAssessmentStateAction.bind(null, courseId, assessment.id)}
            options={NEXT_ASSESSMENT_STATES[assessment.assessment_state].map((s) => ({
              value: s,
              label:
                s === "published"
                  ? t("console.legend.teach.transitions.publish", undefined, "Publish")
                  : s === "archived"
                    ? t("console.legend.teach.transitions.archive", undefined, "Archive")
                    : assessment.assessment_state === "archived"
                      ? t("console.legend.teach.transitions.restore", undefined, "Restore")
                      : t("console.legend.teach.transitions.unpublish", undefined, "Unpublish"),
            }))}
          />
        </div>

        <section className="max-w-2xl space-y-3">
          <h2 className="eyebrow">{t("console.legend.teach.assessments.settingsHeading", undefined, "Settings")}</h2>
          <AssessmentForm
            action={updateAssessmentAction.bind(null, courseId, assessment.id)}
            assessment={assessment}
            cancelHref={`/legend/teach/${courseId}`}
            submitLabel={t("console.legend.teach.assessments.saveSettings", undefined, "Save Settings")}
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="eyebrow">
              {t("console.legend.teach.assessments.questionsHeading", { count: questions.length }, `Questions · ${questions.length}`)}
            </h2>
            <Button href={`/legend/teach/${courseId}/assessments/${assessment.id}/questions/new`} size="sm">
              {t("console.legend.teach.assessments.addQuestion", undefined, "Add Question")}
            </Button>
          </div>
          {questions.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.legend.teach.assessments.noQuestionsTitle", undefined, "No questions yet")}
              description={t(
                "console.legend.teach.assessments.noQuestionsDescription",
                undefined,
                "Add the first question. The assessment can publish once it has at least one.",
              )}
            />
          ) : (
            <ol className="space-y-2">
              {questions.map((q, i) => (
                <li key={q.id} className="surface p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--p-text-1)]">
                        <span className="mr-2 font-mono text-xs text-[var(--p-text-3)]">{i + 1}.</span>
                        {q.prompt}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {(q.options ?? []).map((opt, oi) => (
                          <li key={oi} className="flex items-center gap-2 text-xs">
                            <span
                              className={
                                oi === q.correct_index
                                  ? "font-semibold text-[var(--p-success)]"
                                  : "text-[var(--p-text-2)]"
                              }
                            >
                              {oi === q.correct_index ? "✓" : "·"} {opt}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 font-mono text-xs text-[var(--p-text-3)]">
                        {t("console.legend.teach.assessments.pointsShort", { points: q.points }, `${q.points} pts`)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <StateActions
                        action={moveQuestionAction.bind(null, courseId, assessment.id, q.id)}
                        name="direction"
                        options={[
                          ...(i > 0 ? [{ value: "up", label: "↑" }] : []),
                          ...(i < questions.length - 1 ? [{ value: "down", label: "↓" }] : []),
                        ]}
                      />
                      <Link
                        href={`/legend/teach/${courseId}/assessments/${assessment.id}/questions/${q.id}`}
                        className="ps-btn ps-btn--soft ps-btn--sm"
                      >
                        {t("console.legend.teach.assessments.editQuestion", undefined, "Edit")}
                      </Link>
                      <StateActions
                        action={deleteQuestionAction.bind(null, courseId, assessment.id, q.id)}
                        name="confirm"
                        options={[{ value: "1", label: t("console.legend.teach.assessments.removeQuestion", undefined, "Remove") }]}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
