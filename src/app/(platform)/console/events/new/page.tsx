import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { NewEventForm } from "./NewEventForm";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const { t } = await getRequestT();
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
      <ModuleHeader
        eyebrow={t("console.events.new.eyebrow", undefined, "Work")}
        title={t("console.events.new.title", undefined, "New Event")}
      />
      <div className="page-content max-w-xl">
        <NewEventForm projects={projects} locations={locations} />
      </div>
    </>
  );
}
