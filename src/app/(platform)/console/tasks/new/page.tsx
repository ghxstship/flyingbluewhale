import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { NewTaskForm, type AtomOptionWithProject } from "./NewTaskForm";

export const dynamic = "force-dynamic";

export default async function NewTaskPage() {
  const { t } = await getRequestT();
  let projects: { id: string; name: string }[] = [];
  let atoms: AtomOptionWithProject[] = [];
  if (hasSupabase) {
    const session = await requireSession();
    const supabase = await createClient();
    const [ps, { data: atomRows }] = await Promise.all([
      listOrgScoped("projects", session.orgId, { orderBy: "name", ascending: true }),
      supabase
        .from("xpms_atoms")
        .select("id, identifier, name, project_id, projects:projects!inner(id, name)")
        .eq("org_id", session.orgId)
        .not("project_id", "is", null)
        .order("identifier", { ascending: true }),
    ]);
    projects = ps.map((p) => ({ id: p.id, name: p.name }));
    atoms = (
      (atomRows ?? []) as unknown as Array<{
        id: string;
        identifier: string;
        name: string;
        project_id: string;
        projects: { id: string; name: string } | null;
      }>
    ).map((a) => ({
      id: a.id,
      identifier: a.identifier,
      name: a.name,
      project_id: a.project_id,
      project_name: a.projects?.name ?? null,
    }));
  }
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.tasks.new.eyebrow", undefined, "Work")}
        title={t("console.tasks.new.title", undefined, "New Task")}
      />
      <div className="page-content max-w-xl">
        <NewTaskForm projects={projects} atoms={atoms} />
      </div>
    </>
  );
}
