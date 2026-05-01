import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Accommodation" title="Village" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const rows = await listOrgScoped("venues", session.orgId, {
    orderBy: "name",
    ascending: true,
    limit: 500,
    filters: [{ column: "kind", op: "eq", value: "village" }],
  });

  const totalCapacity = rows.reduce((s, r) => s + (r.capacity ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Accommodation"
        title="Village"
        subtitle={`${rows.length} village${rows.length === 1 ? "" : "s"} · ${totalCapacity.toLocaleString()} bed${totalCapacity === 1 ? "" : "s"}`}
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
          emptyLabel="No villages"
          emptyDescription="Residential clusters live under Venues with kind='village'. Create a venue and set its kind to surface it here."
          emptyAction={
            <Button href="/console/venues/new" size="sm">
              + New Venue
            </Button>
          }
          columns={[
            { key: "name", header: "Name", render: (r) => String(r.name ?? "—") },
            { key: "cluster", header: "Cluster", render: (r) => String(r.cluster ?? "—") },
            {
              key: "capacity",
              header: "Beds",
              render: (r) => (
                <span className="font-mono text-xs">{(r.capacity as number | null)?.toLocaleString() ?? "—"}</span>
              ),
            },
            {
              key: "handover",
              header: "Handover",
              render: (r) => <StatusBadge status={String(r.handover_state ?? "—")} />,
            },
          ]}
        />
      </div>
    </>
  );
}
