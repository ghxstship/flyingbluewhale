import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import type { AssessmentQuestion } from "@/lib/legend_learning";
import { QuestionForm } from "../../../../../QuestionForm";
import { updateQuestionAction } from "../../../../../actions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ courseId: string; assessmentId: string; questionId: string }>;
}) {
  const { courseId, assessmentId, questionId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;
  const [{ data: assessment }, { data: questionRow }] = await Promise.all([
    db
      .from("assessments")
      .select("id, title")
      .eq("id", assessmentId)
      .eq("course_id", courseId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle(),
    db
      .from("assessment_questions")
      .select("id, org_id, assessment_id, prompt, options, correct_index, points, sort_order")
      .eq("id", questionId)
      .eq("assessment_id", assessmentId)
      .eq("org_id", session.orgId)
      .maybeSingle(),
  ]);
  if (!assessment || !questionRow) notFound();
  const question = questionRow as AssessmentQuestion;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.teach.assessments.builderEyebrow", undefined, "Assessment Builder")}
        title={t("console.legend.teach.questions.editTitle", undefined, "Edit Question")}
        breadcrumbs={[
          { label: t("console.legend.teach.breadcrumbRoot", undefined, "LEG3ND") },
          { label: t("console.legend.teach.title", undefined, "Teach"), href: "/legend/teach" },
          { label: assessment.title as string, href: `/legend/teach/${courseId}/assessments/${assessmentId}` },
          { label: t("console.legend.teach.questions.editBreadcrumb", undefined, "Edit question") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <QuestionForm
          action={updateQuestionAction.bind(null, courseId, assessmentId, question.id)}
          question={question}
          cancelHref={`/legend/teach/${courseId}/assessments/${assessmentId}`}
          submitLabel={t("console.legend.teach.questions.editSubmit", undefined, "Save Question")}
        />
      </div>
    </>
  );
}
