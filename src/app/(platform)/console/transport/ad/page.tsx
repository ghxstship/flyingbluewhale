import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return (
    <><ModuleHeader eyebrow="Console" title="A&D manifests" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>
  );
  const session = await requireSession();
  const rows = await listOrgScoped("ad_manifests", session.orgId, { orderBy: "created_at", ascending: false, limit: 500 });
  return (
    <>
      <ModuleHeader eyebrow="Console" title="A&D manifests" subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          columns={[
            { key: "kind", header: "Kind", render: (r) => String(r.kind ?? "—") },
            { key: "flight_ref", header: "Flight", render: (r) => <span className="font-mono text-xs">{String(r.flight_ref ?? "—")}</span> },
            { key: "carrier", header: "Carrier", render: (r) => String(r.carrier ?? "—") },
            { key: "scheduled_at", header: "Scheduled", render: (r) => <span className="font-mono text-xs">{String(r.scheduled_at ?? "—")}</span> },
            { key: "status", header: "Status", render: (r) => String(r.status ?? "—") },
          ]}
        />
      </div>
    </>
  );
}
