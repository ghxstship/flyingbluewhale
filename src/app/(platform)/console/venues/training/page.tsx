import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader eyebrow="Console" title="Training Venues" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("venues", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
    filters: [{ column: "kind", op: "eq", value: "training" }],
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Console"
        title="Training Venues"
        subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/venues/${r.id}`}
          emptyLabel="No training venues"
          emptyDescription="Sub-set of venues filtered to training spaces. Edit the venue record itself for capacity, layout, and handover state."
          columns={[
            { key: "name", header: "Name", render: (r) => String(r.name ?? "—") },
            { key: "kind", header: "Kind", render: (r) => String(r.kind ?? "—") },
            {
              key: "capacity",
              header: "Capacity",
              render: (r) => <span className="font-mono text-xs">{String(r.capacity ?? "—")}</span>,
            },
          ]}
        />
      </div>
    </>
  );
}
