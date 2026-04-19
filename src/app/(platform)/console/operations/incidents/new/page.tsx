export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { IncidentForm } from "@/components/incidents/IncidentForm";

export default async function NewIncidentPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project } = await searchParams;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name");

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        title="Log incident"
        subtitle="Safety + near-miss reports. Photos upload directly from the camera or drop in the box."
        breadcrumbs={[
          { label: "Operations", href: "/console/operations" },
          { label: "Incidents", href: "/console/operations/incidents" },
          { label: "Log" },
        ]}
      />
      <div className="page-content max-w-3xl">
        <IncidentForm
          projects={projects ?? []}
          defaultProjectId={project}
          returnHref="/console/operations/incidents"
        />
      </div>
    </>
  );
}
