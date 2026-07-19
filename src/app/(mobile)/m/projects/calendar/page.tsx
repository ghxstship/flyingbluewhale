import { requireSession, isManagerPlus } from "@/lib/auth";
import { resolveProjectContext, listProjectEvents } from "@/lib/mobile/project-xpms";
import { ProjectCalendarView } from "./ProjectCalendarView";

export const dynamic = "force-dynamic";

/** COMPVSS · Project Calendar (kit 34 v3.6) — XPMS-keyed project events. */
export default async function ProjectCalendarPage() {
  const session = await requireSession();
  const project = await resolveProjectContext(session.orgId);
  const items = project ? await listProjectEvents(session.orgId, project.id) : [];
  return <ProjectCalendarView items={items} canManage={isManagerPlus(session)} />;
}
