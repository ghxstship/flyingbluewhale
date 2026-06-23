import { ModuleHeader } from "@/components/Shell";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NewSprintForm } from "../SprintForms";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function NewSprintPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("org_id", session.orgId)
    .eq("id", projectId)
    .maybeSingle();

  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? "Project"}
        title="New Sprint"
        breadcrumbs={[
          { label: "Projects", href: "/studio/projects" },
          { label: project?.name ?? "Project", href: `/studio/projects/${projectId}` },
          { label: "Sprints", href: `/studio/projects/${projectId}/sprints` },
          { label: "New" },
        ]}
      />
      <div className="page-content max-w-2xl">
        {isManagerPlus(session) ? (
          <NewSprintForm projectId={projectId} />
        ) : (
          <EmptyState title="Not Permitted" description="Only manager+ roles can create sprints." />
        )}
      </div>
    </>
  );
}
