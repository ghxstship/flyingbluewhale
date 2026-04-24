import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return (
    <><ModuleHeader eyebrow="Console" title="Gate scans" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>
  );
  const session = await requireSession();
  const rows = await listOrgScoped("access_scans", session.orgId, { orderBy: "created_at", ascending: false, limit: 500 });
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Gate scans" subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          columns={[
            { key: "result", header: "Result", render: (r) => String(r.result ?? "—") },
            { key: "reason", header: "Reason", render: (r) => String(r.reason ?? "—") },
            { key: "gate_code", header: "Gate", render: (r) => <span className="font-mono text-xs">{String(r.gate_code ?? "—")}</span> },
            { key: "scanned_at", header: "At", render: (r) => <span className="font-mono text-xs">{String(r.scanned_at ?? "—")}</span> },
          ]}
        />
      </div>
    </>
  );
}
