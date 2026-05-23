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
        <ModuleHeader eyebrow="Workspace" title="Environmental Events" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("environmental_events", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Safety"
        title="Environmental Events"
        subtitle={`${rows.length} Record${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/safety/environmental/new" size="sm">
            + Log event
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/safety/environmental/${r.id}`}
          emptyLabel="No environmental events"
          emptyDescription="Heat/cold/wind/storm windows and wildlife/biohazard incidents — drives op-pause + protocol triggers."
          emptyAction={
            <Button href="/console/safety/environmental/new" size="sm">
              + Log event
            </Button>
          }
          columns={[
            {
              key: "kind",
              header: "Kind",
              render: (r) => String(r.kind ?? "—"),
              accessor: (r) => r.kind ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "severity",
              header: "Severity",
              render: (r) => String(r.severity ?? "—"),
              accessor: (r) => r.severity ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "started_at",
              header: "Started",
              render: (r) => <span className="font-mono text-xs">{String(r.started_at ?? "—")}</span>,
              accessor: (r) => r.started_at ?? null,
            },
            {
              key: "ended_at",
              header: "Ended",
              render: (r) => <span className="font-mono text-xs">{String(r.ended_at ?? "—")}</span>,
              accessor: (r) => r.ended_at ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
