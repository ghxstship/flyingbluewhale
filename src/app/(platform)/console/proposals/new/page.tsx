import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { NewProposalForm } from "./NewProposalForm";

export const dynamic = "force-dynamic";

export default async function NewProposalPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
  const q = await searchParams;
  const defaultClientId = q.clientId;
  let clients: { id: string; name: string }[] = [];
  let projects: { id: string; name: string }[] = [];
  if (hasSupabase) {
    const session = await requireSession();
    const [cs, ps] = await Promise.all([
      listOrgScoped("clients", session.orgId, { orderBy: "name", ascending: true }),
      listOrgScoped("projects", session.orgId, { orderBy: "name", ascending: true }),
    ]);
    clients = cs.map((c) => ({ id: c.id, name: c.name }));
    projects = ps.map((p) => ({ id: p.id, name: p.name }));
  }
  return (
    <>
      <ModuleHeader eyebrow="Sales" title="New proposal" />
      <div className="page-content max-w-2xl">
        <NewProposalForm clients={clients} projects={projects} defaultClientId={defaultClientId} />
      </div>
    </>
  );
}
