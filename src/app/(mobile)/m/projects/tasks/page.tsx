import { requireSession, isManagerPlus } from "@/lib/auth";
import { resolveProjectContext, listProjectTasks } from "@/lib/mobile/project-xpms";
import { ProjectTasksView } from "./ProjectTasksView";

export const dynamic = "force-dynamic";

/** COMPVSS · Project Tasks (kit 34 v3.6) — the XPMS SSOT field task dataset. */
export default async function ProjectTasksPage() {
  const session = await requireSession();
  const project = await resolveProjectContext(session.orgId);
  const items = project ? await listProjectTasks(session.orgId, project.id) : [];
  return <ProjectTasksView items={items} canManage={isManagerPlus(session)} />;
}
