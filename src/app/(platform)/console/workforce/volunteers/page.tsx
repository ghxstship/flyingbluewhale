import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return (
    <><ModuleHeader eyebrow="Console" title="Volunteers" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>
  );
  const session = await requireSession();
  const rows = await listOrgScoped("workforce_members", session.orgId, { orderBy: "created_at", ascending: false, limit: 500, filters: [{ column: "kind", op: "eq", value: "volunteer" }] });
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Volunteers" subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          columns={[
            { key: "full_name", header: "Name", render: (r) => String(r.full_name ?? "—") },
            { key: "role", header: "Role", render: (r) => String(r.role ?? "—") },
            { key: "email", header: "Email", render: (r) => <span className="font-mono text-xs">{String(r.email ?? "—")}</span> },
          ]}
        />
      </div>
    </>
  );
}
