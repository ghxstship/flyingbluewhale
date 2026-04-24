import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return (
    <><ModuleHeader eyebrow="Console" title="Group blocks" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>
  );
  const session = await requireSession();
  const rows = await listOrgScoped("accommodation_blocks", session.orgId, { orderBy: "created_at", ascending: false, limit: 500 });
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Group blocks" subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          columns={[
            { key: "name", header: "Name", render: (r) => String(r.name ?? "—") },
            { key: "property", header: "Property", render: (r) => String(r.property ?? "—") },
            { key: "stakeholder_group", header: "Group", render: (r) => String(r.stakeholder_group ?? "—") },
            { key: "rooms_reserved", header: "Reserved", render: (r) => <span className="font-mono text-xs">{String(r.rooms_reserved ?? "—")}</span> },
            { key: "rooms_confirmed", header: "Confirmed", render: (r) => <span className="font-mono text-xs">{String(r.rooms_confirmed ?? "—")}</span> },
          ]}
        />
      </div>
    </>
  );
}
