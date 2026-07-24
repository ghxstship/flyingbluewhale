import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import type { Course } from "@/lib/legend_learning";
import { CourseForm } from "../../CourseForm";
import { updateCourseAction } from "../../actions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;
  const [{ data: courseRow }, { data: certData }] = await Promise.all([
    db
      .from("legend_courses")
      .select("id, org_id, title, summary, cover_path, points_reward, grants_certification_id, course_state, created_at, updated_at")
      .eq("id", courseId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle(),
    db
      .from("legend_certifications")
      .select("id, name")
      .eq("org_id", session.orgId)
      .eq("certification_state", "active")
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .limit(200),
  ]);
  if (!courseRow) notFound();
  const course = courseRow as Course;
  const certifications = (certData ?? []) as Array<{ id: string; name: string }>;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.teach.edit.eyebrow", undefined, "Course Editor")}
        title={t("console.legend.teach.edit.title", undefined, "Edit Course")}
        breadcrumbs={[
          { label: t("console.legend.teach.breadcrumbRoot", undefined, "LEG3ND") },
          { label: t("console.legend.teach.title", undefined, "Teach"), href: "/legend/teach" },
          { label: course.title, href: `/legend/teach/${course.id}` },
          { label: t("console.legend.teach.edit.breadcrumb", undefined, "Edit") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <CourseForm
          action={updateCourseAction.bind(null, course.id)}
          course={course}
          certifications={certifications}
          cancelHref={`/legend/teach/${course.id}`}
          submitLabel={t("console.legend.teach.edit.submit", undefined, "Save Course")}
        />
      </div>
    </>
  );
}
