import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { LessonForm } from "../../../LessonForm";
import { createLessonAction } from "../../../actions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function NewLessonPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data: course } = await db
    .from("legend_courses")
    .select("id, title")
    .eq("id", courseId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!course) notFound();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.teach.editor.eyebrow", undefined, "Course Editor")}
        title={t("console.legend.teach.lessons.newTitle", undefined, "New Lesson")}
        breadcrumbs={[
          { label: t("console.legend.teach.breadcrumbRoot", undefined, "LEG3ND") },
          { label: t("console.legend.teach.title", undefined, "Teach"), href: "/legend/teach" },
          { label: course.title as string, href: `/legend/teach/${courseId}` },
          { label: t("console.legend.teach.lessons.newBreadcrumb", undefined, "New lesson") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <LessonForm
          action={createLessonAction.bind(null, courseId)}
          cancelHref={`/legend/teach/${courseId}`}
          submitLabel={t("console.legend.teach.lessons.newSubmit", undefined, "Add Lesson")}
        />
      </div>
    </>
  );
}
