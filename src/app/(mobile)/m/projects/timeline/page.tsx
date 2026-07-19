import { requireSession, isManagerPlus } from "@/lib/auth";
import { resolveProjectContext, listProjectMilestones } from "@/lib/mobile/project-xpms";
import { ProjectTimelineView } from "./ProjectTimelineView";

export const dynamic = "force-dynamic";

/** COMPVSS · Timeline (kit 34 v3.2) — field phases + milestone rollup. */
export default async function ProjectTimelinePage() {
  const session = await requireSession();
  const project = await resolveProjectContext(session.orgId);
  const milestones = project ? await listProjectMilestones(session.orgId, project.id) : [];
  return (
    <ProjectTimelineView
      milestones={milestones}
      projectName={project?.name ?? null}
      xpmsPhase={project?.phase ?? null}
      canManage={isManagerPlus(session)}
    />
  );
}
