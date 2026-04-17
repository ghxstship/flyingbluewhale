import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { NewPoForm } from "./NewPoForm";

export const dynamic = "force-dynamic";

export default async function NewPOPage() {
  let vendors: { id: string; name: string }[] = [];
  let projects: { id: string; name: string }[] = [];
  if (hasSupabase) {
    const session = await requireSession();
    const [vs, ps] = await Promise.all([
      listOrgScoped("vendors", session.orgId, { orderBy: "name", ascending: true }),
      listOrgScoped("projects", session.orgId, { orderBy: "name", ascending: true }),
    ]);
    vendors = vs.map((v) => ({ id: v.id, name: v.name }));
    projects = ps.map((p) => ({ id: p.id, name: p.name }));
  }
  return (
    <>
      <ModuleHeader eyebrow="Procurement" title="New purchase order" />
      <div className="page-content max-w-xl"><NewPoForm vendors={vendors} projects={projects} /></div>
    </>
  );
}
