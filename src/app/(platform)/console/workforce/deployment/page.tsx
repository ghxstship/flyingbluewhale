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
        <ModuleHeader eyebrow="Console" title="Deployment" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("workforce_deployments", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Deployment"
        subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/workforce/deployment/new" size="sm">
            + Plan deployment
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/workforce/deployment/${r.id}`}
          emptyLabel="No deployments planned"
          emptyDescription="Per-area FTE planning and run-time variance tracked against the workforce plan."
          emptyAction={
            <Button href="/console/workforce/deployment/new" size="sm">
              + Plan deployment
            </Button>
          }
          columns={[
            {
              key: "functional_area",
              header: "Area",
              render: (r) => String(r.functional_area ?? "—"),
              accessor: (r) => r.functional_area ?? null,
            },
            {
              key: "planned_fte",
              header: "Planned",
              render: (r) => <span className="font-mono text-xs">{String(r.planned_fte ?? "—")}</span>,
            },
            {
              key: "actual_fte",
              header: "Actual",
              render: (r) => <span className="font-mono text-xs">{String(r.actual_fte ?? "—")}</span>,
            },
          ]}
        />
      </div>
    </>
  );
}
