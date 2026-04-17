import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { NewTaskForm } from "./NewTaskForm";

export const dynamic = "force-dynamic";

export default async function NewTaskPage() {
  let projects: { id: string; name: string }[] = [];
  if (hasSupabase) {
    const session = await requireSession();
    const ps = await listOrgScoped("projects", session.orgId, { orderBy: "name", ascending: true });
    projects = ps.map((p) => ({ id: p.id, name: p.name }));
  }
  return (
    <>
      <ModuleHeader eyebrow="Work" title="New task" />
      <div className="page-content max-w-xl"><NewTaskForm projects={projects} /></div>
    </>
  );
}
