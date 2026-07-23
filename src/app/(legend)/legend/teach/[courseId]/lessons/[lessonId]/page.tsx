import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import type { Lesson } from "@/lib/legend_learning";
import { LessonForm } from "../../../LessonForm";
import { updateLessonAction } from "../../../actions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;
  const [{ data: course }, { data: lessonRow }] = await Promise.all([
    db
      .from("legend_courses")
      .select("id, title")
      .eq("id", courseId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle(),
    db
      .from("lessons")
      .select("id, org_id, course_id, module_id, title, kind, media_url, body_html, duration_seconds, sort_order, lesson_state")
      .eq("id", lessonId)
      .eq("course_id", courseId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);
  if (!course || !lessonRow) notFound();
  const lesson = lessonRow as Lesson;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.teach.editor.eyebrow", undefined, "Course Editor")}
        title={t("console.legend.teach.lessons.editTitle", undefined, "Edit Lesson")}
        subtitle={lesson.title}
        breadcrumbs={[
          { label: t("console.legend.teach.breadcrumbRoot", undefined, "LEG3ND") },
          { label: t("console.legend.teach.title", undefined, "Teach"), href: "/legend/teach" },
          { label: course.title as string, href: `/legend/teach/${courseId}` },
          { label: lesson.title },
        ]}
      />
      <div className="page-content max-w-2xl">
        <LessonForm
          action={updateLessonAction.bind(null, courseId, lesson.id)}
          lesson={lesson}
          cancelHref={`/legend/teach/${courseId}`}
          submitLabel={t("console.legend.teach.lessons.editSubmit", undefined, "Save Lesson")}
        />
      </div>
    </>
  );
}
