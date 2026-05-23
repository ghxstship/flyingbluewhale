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
        <ModuleHeader eyebrow="Workspace" title="Dispatch" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("dispatch_runs", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Transport"
        title="Dispatch"
        subtitle={`${rows.length} Run${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/transport/dispatch/new" size="sm">
            + New Run
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/transport/dispatch/${r.id}`}
          emptyLabel="No dispatch runs yet"
          emptyDescription="Schedule a vehicle from origin to destination — fleet T1/T2/T3, media, workforce, or spectator."
          emptyAction={
            <Button href="/console/transport/dispatch/new" size="sm">
              + New Run
            </Button>
          }
          columns={[
            { key: "fleet", header: "Fleet", render: (r) => String(r.fleet ?? "—"), accessor: (r) => r.fleet ?? null },
            {
              key: "vehicle_ref",
              header: "Vehicle",
              render: (r) => <span className="font-mono text-xs">{String(r.vehicle_ref ?? "—")}</span>,
              accessor: (r) => r.vehicle_ref ?? null,
            },
            {
              key: "scheduled_depart",
              header: "Depart",
              render: (r) => <span className="font-mono text-xs">{String(r.scheduled_depart ?? "—")}</span>,
              accessor: (r) => r.scheduled_depart ?? null,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => String(r.status ?? "—"),
              accessor: (r) => r.status ?? null,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
