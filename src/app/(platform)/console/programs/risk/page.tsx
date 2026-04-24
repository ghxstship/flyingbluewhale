import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return (
    <><ModuleHeader eyebrow="Console" title="Risk register" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>
  );
  const session = await requireSession();
  const rows = await listOrgScoped("risks", session.orgId, { orderBy: "created_at", ascending: false, limit: 500 });
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Risk register" subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          columns={[
            { key: "title", header: "Title", render: (r) => String(r.title ?? "—") },
            { key: "kind", header: "Kind", render: (r) => String(r.kind ?? "—") },
            { key: "category", header: "Category", render: (r) => String(r.category ?? "—") },
            { key: "inherent_score", header: "Score", render: (r) => <span className="font-mono text-xs">{String(r.inherent_score ?? "—")}</span> },
            { key: "status", header: "Status", render: (r) => String(r.status ?? "—") },
            { key: "due_on", header: "Due", render: (r) => <span className="font-mono text-xs">{String(r.due_on ?? "—")}</span> },
          ]}
        />
      </div>
    </>
  );
}
