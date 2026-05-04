import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

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

  const fmt = await getRequestFormatters();
  const totalCapacity = rows.reduce((s, r) => s + (r.capacity ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Accommodation"
        title="Village"
        subtitle={`${rows.length} village${rows.length === 1 ? "" : "s"} · ${fmt.number(totalCapacity)} bed${totalCapacity === 1 ? "" : "s"}`}
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
            { key: "name", header: "Name", render: (r) => String(r.name ?? "—"), accessor: (r) => r.name ?? null },
            {
              key: "cluster",
              header: "Cluster",
              render: (r) => String(r.cluster ?? "—"),
              accessor: (r) => r.cluster ?? null,
            },
            {
              key: "capacity",
              header: "Beds",
              render: (r) => (
                <span className="font-mono text-xs">{r.capacity != null ? fmt.number(r.capacity as number) : "—"}</span>
              ),
              accessor: (r) => r.capacity ?? null,
            },
            {
              key: "handover",
              header: "Handover",
              render: (r) => <StatusBadge status={String(r.handover_state ?? "—")} />,
              accessor: (r) => r.handover_state ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
