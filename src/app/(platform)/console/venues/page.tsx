import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return (
    <><ModuleHeader eyebrow="Console" title="Venues" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>
  );
  const session = await requireSession();
  const rows = await listOrgScoped("venues", session.orgId, { orderBy: "created_at", ascending: false, limit: 500 });
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Venues" subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          columns={[
            { key: "name", header: "Name", render: (r) => String(r.name ?? "—") },
            { key: "kind", header: "Kind", render: (r) => String(r.kind ?? "—") },
            { key: "cluster", header: "Cluster", render: (r) => String(r.cluster ?? "—") },
            { key: "capacity", header: "Capacity", render: (r) => <span className="font-mono text-xs">{String(r.capacity ?? "—")}</span> },
            { key: "handover_state", header: "Handover", render: (r) => String(r.handover_state ?? "—") },
          ]}
        />
      </div>
    </>
  );
}
