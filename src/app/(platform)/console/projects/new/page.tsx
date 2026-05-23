import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { NewProjectForm } from "./NewProjectForm";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const session = await requireSession();
  const [clients, venues] = await Promise.all([
    listOrgScoped("clients", session.orgId, { orderBy: "name", ascending: true }),
    listOrgScoped("venues", session.orgId, { orderBy: "name", ascending: true }),
  ]);

  return (
    <>
      <ModuleHeader title="New Project" subtitle="Create a project for your organization" />
      <div className="page-content max-w-2xl">
        <NewProjectForm
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          venues={venues.map((v) => ({ id: v.id, name: v.name }))}
        />
      </div>
    </>
  );
}
