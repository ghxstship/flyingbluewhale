import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { QuestionForm } from "../../../../../QuestionForm";
import { createQuestionAction } from "../../../../../actions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function NewQuestionPage({
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
  const { data: assessment } = await db
    .from("assessments")
    .select("id, title")
    .eq("id", assessmentId)
    .eq("course_id", courseId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!assessment) notFound();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.teach.assessments.builderEyebrow", undefined, "Assessment Builder")}
        title={t("console.legend.teach.questions.newTitle", undefined, "New Question")}
        breadcrumbs={[
          { label: t("console.legend.teach.breadcrumbRoot", undefined, "LEG3ND") },
          { label: t("console.legend.teach.title", undefined, "Teach"), href: "/legend/teach" },
          { label: assessment.title as string, href: `/legend/teach/${courseId}/assessments/${assessmentId}` },
          { label: t("console.legend.teach.questions.newBreadcrumb", undefined, "New question") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <QuestionForm
          action={createQuestionAction.bind(null, courseId, assessmentId)}
          cancelHref={`/legend/teach/${courseId}/assessments/${assessmentId}`}
          submitLabel={t("console.legend.teach.questions.newSubmit", undefined, "Add Question")}
        />
      </div>
    </>
  );
}
