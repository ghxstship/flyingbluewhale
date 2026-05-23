import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import type { GuardTour } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type GuardTourRow = GuardTour;

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  scheduled: "muted",
  in_progress: "info",
  completed: "success",
  cancelled: "muted",
  overdue: "error",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Safety" title="Guard Tours" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const rows = (await listOrgScoped("guard_tours", session.orgId, {
    orderBy: "next_run_at",
    ascending: true,
    limit: 500,
  })) as GuardTourRow[];

  const overdue = rows.filter((r) => r.status === "overdue").length;
  const inProgress = rows.filter((r) => r.status === "in_progress").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Safety"
        title="Guard Tours"
        subtitle={`${rows.length} Tour${rows.length === 1 ? "" : "s"} · ${inProgress} in progress · ${overdue} overdue`}
        action={
          <Button href="/console/safety/guard-tours/new" size="sm">
            + Schedule tour
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          emptyLabel="No guard tours scheduled"
          emptyDescription="Patrol plans live here. Each tour has an ordered route of geofenced checkpoints; mobile patrol scans them in order via /m/guard."
          emptyAction={
            <Button href="/console/safety/guard-tours/new" size="sm">
              + Schedule tour
            </Button>
          }
          columns={[
            { key: "name", header: "Name", render: (r) => String(r.name ?? "—"), accessor: (r) => r.name ?? null },
            {
              key: "cadence",
              header: "Cadence",
              render: (r) => (r.cadence_minutes ? `every ${r.cadence_minutes}m` : "ad-hoc"),
              className: "font-mono text-xs",
              accessor: (r) => r.cadence_minutes ?? null,
            },
            {
              key: "next_run",
              header: "Next Run",
              render: (r) =>
                r.next_run_at
                  ? new Date(String(r.next_run_at)).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—",
              className: "font-mono text-xs",
              accessor: (r) => r.next_run_at ?? null,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => (
                <Badge variant={STATUS_TONE[String(r.status)] ?? "muted"}>{String(r.status).replace(/_/g, " ")}</Badge>
              ),
              filterable: true,
              groupable: true,
              accessor: (r) => r.status ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
