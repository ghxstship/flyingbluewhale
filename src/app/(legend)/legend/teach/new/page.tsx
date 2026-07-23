import { ModuleHeader } from "@/components/Shell";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { CourseForm } from "../CourseForm";
import { createCourseAction } from "../actions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function NewCoursePage() {
  const { t } = await getRequestT();
  const eyebrow = t("console.legend.teach.eyebrow", undefined, "LEG3ND · Manage");
  const title = t("console.legend.teach.new.title", undefined, "New Course");
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow={eyebrow} title={title} />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data } = await db
    .from("legend_certifications")
    .select("id, name")
    .eq("org_id", session.orgId)
    .eq("certification_state", "active")
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .limit(200);
  const certifications = (data ?? []) as Array<{ id: string; name: string }>;

  return (
    <>
      <ModuleHeader
        eyebrow={eyebrow}
        title={title}
        breadcrumbs={[
          { label: t("console.legend.teach.breadcrumbRoot", undefined, "LEG3ND") },
          { label: t("console.legend.teach.title", undefined, "Teach"), href: "/legend/teach" },
          { label: t("console.legend.teach.new.breadcrumb", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <CourseForm
          action={createCourseAction}
          certifications={certifications}
          cancelHref="/legend/teach"
          submitLabel={t("console.legend.teach.new.submit", undefined, "Create Course")}
        />
      </div>
    </>
  );
}
