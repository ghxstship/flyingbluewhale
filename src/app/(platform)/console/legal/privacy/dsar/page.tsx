import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return (
    <><ModuleHeader eyebrow="Console" title="DSAR requests" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>
  );
  const session = await requireSession();
  const rows = await listOrgScoped("dsar_requests", session.orgId, { orderBy: "created_at", ascending: false, limit: 500 });
  return (
    <>
      <ModuleHeader eyebrow="Console" title="DSAR requests" subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          columns={[
            { key: "requester_email", header: "Requester", render: (r) => <span className="font-mono text-xs">{String(r.requester_email ?? "—")}</span> },
            { key: "kind", header: "Kind", render: (r) => String(r.kind ?? "—") },
            { key: "status", header: "Status", render: (r) => String(r.status ?? "—") },
            { key: "due_by", header: "Due", render: (r) => <span className="font-mono text-xs">{String(r.due_by ?? "—")}</span> },
          ]}
        />
      </div>
    </>
  );
}
