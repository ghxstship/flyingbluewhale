import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return (
    <><ModuleHeader eyebrow="Console" title="Carbon" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>
  );
  const session = await requireSession();
  const rows = await listOrgScoped("sustainability_metrics", session.orgId, { orderBy: "created_at", ascending: false, limit: 500 });
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Carbon" subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          columns={[
            { key: "period_start", header: "Start", render: (r) => <span className="font-mono text-xs">{String(r.period_start ?? "—")}</span> },
            { key: "period_end", header: "End", render: (r) => <span className="font-mono text-xs">{String(r.period_end ?? "—")}</span> },
            { key: "scope", header: "Scope", render: (r) => <span className="font-mono text-xs">{String(r.scope ?? "—")}</span> },
            { key: "kg_co2e", header: "kg CO₂e", render: (r) => <span className="font-mono text-xs">{String(r.kg_co2e ?? "—")}</span> },
          ]}
        />
      </div>
    </>
  );
}
