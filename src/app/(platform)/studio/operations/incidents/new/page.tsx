export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { IncidentForm } from "@/components/incidents/IncidentForm";
import { getRequestT } from "@/lib/i18n/request";

export default async function NewIncidentPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project } = await searchParams;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.operations.incidents.new.eyebrow", undefined, "Operations")}
        title={t("console.operations.incidents.new.title", undefined, "Log Incident")}
        subtitle={t("console.operations.incidents.new.subtitle", undefined, "Safety + near-miss reports.")}
        breadcrumbs={[
          { label: t("console.operations.breadcrumb", undefined, "Operations"), href: "/studio/operations" },
          {
            label: t("console.operations.incidents.breadcrumb", undefined, "Incidents"),
            href: "/studio/operations/incidents",
          },
          { label: t("console.operations.incidents.new.breadcrumbLog", undefined, "Log") },
        ]}
      />
      <div className="page-content max-w-3xl">
        <IncidentForm projects={projects ?? []} defaultProjectId={project} returnHref="/studio/operations/incidents" />
      </div>
    </>
  );
}
