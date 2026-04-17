import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { NewEventForm } from "./NewEventForm";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  let projects: { id: string; name: string }[] = [];
  let locations: { id: string; name: string }[] = [];
  if (hasSupabase) {
    const session = await requireSession();
    const [ps, ls] = await Promise.all([
      listOrgScoped("projects", session.orgId, { orderBy: "name", ascending: true }),
      listOrgScoped("locations", session.orgId, { orderBy: "name", ascending: true }),
    ]);
    projects = ps.map((p) => ({ id: p.id, name: p.name }));
    locations = ls.map((l) => ({ id: l.id, name: l.name }));
  }
  return (
    <>
      <ModuleHeader eyebrow="Work" title="New event" />
      <div className="page-content max-w-xl"><NewEventForm projects={projects} locations={locations} /></div>
    </>
  );
}
