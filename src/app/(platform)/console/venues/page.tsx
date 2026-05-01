import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader eyebrow="Console" title="Venues" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("venues", session.orgId, { orderBy: "created_at", ascending: false, limit: 500 });
  return (
    <>
      <ModuleHeader
        eyebrow="Console"
        title="Venues"
        subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/venues/new" size="sm">
            + New Venue
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/venues/${r.id}`}
          emptyLabel="No venues"
          emptyDescription="Author each venue with kind, cluster, and capacity. Handover state tracks readiness through bump-out."
          columns={[
            { key: "name", header: "Name", render: (r) => String(r.name ?? "—"), accessor: (r) => r.name ?? null },
            {
              key: "kind",
              header: "Kind",
              render: (r) => String(r.kind ?? "—"),
              accessor: (r) => r.kind ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "cluster",
              header: "Cluster",
              render: (r) => String(r.cluster ?? "—"),
              accessor: (r) => r.cluster ?? null,
            },
            {
              key: "capacity",
              header: "Capacity",
              render: (r) => <span className="font-mono text-xs">{String(r.capacity ?? "—")}</span>,
              accessor: (r) => r.capacity ?? null,
            },
            {
              key: "handover_state",
              header: "Handover",
              render: (r) => String(r.handover_state ?? "—"),
              accessor: (r) => r.handover_state ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
