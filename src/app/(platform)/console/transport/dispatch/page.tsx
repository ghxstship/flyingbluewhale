import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return (
    <><ModuleHeader eyebrow="Console" title="Dispatch" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>
  );
  const session = await requireSession();
  const rows = await listOrgScoped("dispatch_runs", session.orgId, { orderBy: "created_at", ascending: false, limit: 500 });
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Dispatch" subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          columns={[
            { key: "fleet", header: "Fleet", render: (r) => String(r.fleet ?? "—") },
            { key: "vehicle_ref", header: "Vehicle", render: (r) => <span className="font-mono text-xs">{String(r.vehicle_ref ?? "—")}</span> },
            { key: "scheduled_depart", header: "Depart", render: (r) => <span className="font-mono text-xs">{String(r.scheduled_depart ?? "—")}</span> },
            { key: "status", header: "Status", render: (r) => String(r.status ?? "—") },
          ]}
        />
      </div>
    </>
  );
}
