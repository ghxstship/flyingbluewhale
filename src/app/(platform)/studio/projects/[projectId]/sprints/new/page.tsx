import { ModuleHeader } from "@/components/Shell";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { NewSprintForm } from "../SprintForms";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function NewSprintPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { t } = await getRequestT();
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
        eyebrow={project?.name ?? t("console.projects.sprints.projectFallback", undefined, "Project")}
        title={t("console.projects.sprints.new.title", undefined, "New Sprint")}
        breadcrumbs={[
          { label: t("console.projects.sprints.breadcrumb.projects", undefined, "Projects"), href: "/studio/projects" },
          {
            label: project?.name ?? t("console.projects.sprints.projectFallback", undefined, "Project"),
            href: `/studio/projects/${projectId}`,
          },
          {
            label: t("console.projects.sprints.title", undefined, "Sprints"),
            href: `/studio/projects/${projectId}/sprints`,
          },
          { label: t("console.projects.sprints.new.breadcrumb", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-2xl">
        {isManagerPlus(session) ? (
          <NewSprintForm projectId={projectId} />
        ) : (
          <EmptyState
            title={t("console.projects.sprints.new.notPermitted", undefined, "Not Permitted")}
            description={t(
              "console.projects.sprints.new.notPermittedDescription",
              undefined,
              "Only manager+ roles can create sprints.",
            )}
          />
        )}
      </div>
    </>
  );
}
