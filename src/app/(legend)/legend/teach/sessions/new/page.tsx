import { ModuleHeader } from "@/components/Shell";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { listOrgMembers } from "@/lib/db/legend-people";
import { SessionForm } from "../SessionForm";
import { createSessionAction } from "../actions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  const { t } = await getRequestT();
  const eyebrow = t("console.legend.teach.eyebrow", undefined, "LEG3ND · Manage");
  const title = t("console.legend.teach.sessions.newTitle", undefined, "New Session");
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
  const [members, { data: courseData }] = await Promise.all([
    listOrgMembers(session.orgId),
    db
      .from("legend_courses")
      .select("id, title")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("title", { ascending: true })
      .limit(200),
  ]);
  const courses = (courseData ?? []) as Array<{ id: string; title: string }>;

  return (
    <>
      <ModuleHeader
        eyebrow={eyebrow}
        title={title}
        breadcrumbs={[
          { label: t("console.legend.teach.breadcrumbRoot", undefined, "LEG3ND") },
          { label: t("console.legend.teach.title", undefined, "Teach"), href: "/legend/teach" },
          { label: t("console.legend.teach.sessions.breadcrumb", undefined, "Sessions"), href: "/legend/teach/sessions" },
          { label: t("console.legend.teach.sessions.newBreadcrumb", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <SessionForm
          action={createSessionAction}
          courses={courses}
          hosts={members.map((m) => ({ id: m.id, name: m.name }))}
          submitLabel={t("console.legend.teach.sessions.newSubmit", undefined, "Schedule Session")}
        />
      </div>
    </>
  );
}
