import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return (
    <><ModuleHeader eyebrow="Console" title="Environmental events" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>
  );
  const session = await requireSession();
  const rows = await listOrgScoped("environmental_events", session.orgId, { orderBy: "created_at", ascending: false, limit: 500 });
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Environmental events" subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          columns={[
            { key: "kind", header: "Kind", render: (r) => String(r.kind ?? "—") },
            { key: "severity", header: "Severity", render: (r) => String(r.severity ?? "—") },
            { key: "started_at", header: "Started", render: (r) => <span className="font-mono text-xs">{String(r.started_at ?? "—")}</span> },
            { key: "ended_at", header: "Ended", render: (r) => <span className="font-mono text-xs">{String(r.ended_at ?? "—")}</span> },
          ]}
        />
      </div>
    </>
  );
}
