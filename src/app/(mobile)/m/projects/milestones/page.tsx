import { requireSession, isManagerPlus } from "@/lib/auth";
import { resolveProjectContext, listProjectMilestones } from "@/lib/mobile/project-xpms";
import { ProjectMilestonesView } from "./ProjectMilestonesView";

export const dynamic = "force-dynamic";

/** COMPVSS · Milestones (kit 34 v3.2) — deliverables rolling up to each field phase. */
export default async function ProjectMilestonesPage() {
  const session = await requireSession();
  const project = await resolveProjectContext(session.orgId);
  const items = project ? await listProjectMilestones(session.orgId, project.id) : [];
  return <ProjectMilestonesView items={items} canManage={isManagerPlus(session)} />;
}
