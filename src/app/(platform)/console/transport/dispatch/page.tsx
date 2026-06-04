import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.transport.dispatch.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.transport.dispatch.title", undefined, "Dispatch")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.transport.dispatch.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.transport.dispatch.eyebrow", undefined, "Transport")}
        title={t("console.transport.dispatch.title", undefined, "Dispatch")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.transport.dispatch.runSingular", undefined, "Run") : t("console.transport.dispatch.runPlural", undefined, "Runs")}`}
        action={
          <Button href="/console/transport/dispatch/new" size="sm">
            {t("console.transport.dispatch.newRun", undefined, "+ New Run")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/transport/dispatch/${r.id}`}
          emptyLabel={t("console.transport.dispatch.emptyLabel", undefined, "No dispatch runs yet")}
          emptyDescription={t(
            "console.transport.dispatch.emptyDescription",
            undefined,
            "Schedule a vehicle from origin to destination — fleet T1/T2/T3, media, workforce, or spectator.",
          )}
          emptyAction={
            <Button href="/console/transport/dispatch/new" size="sm">
              {t("console.transport.dispatch.newRun", undefined, "+ New Run")}
            </Button>
          }
          columns={[
            {
              key: "fleet",
              header: t("console.transport.dispatch.col.fleet", undefined, "Fleet"),
              render: (r) => String(r.fleet ?? "—"),
              accessor: (r) => r.fleet ?? null,
            },
            {
              key: "vehicle_ref",
              header: t("console.transport.dispatch.col.vehicle", undefined, "Vehicle"),
              render: (r) => <span className="font-mono text-xs">{String(r.vehicle_ref ?? "—")}</span>,
              accessor: (r) => r.vehicle_ref ?? null,
            },
            {
              key: "scheduled_depart",
              header: t("console.transport.dispatch.col.depart", undefined, "Depart"),
              render: (r) => <span className="font-mono text-xs">{String(r.scheduled_depart ?? "—")}</span>,
              accessor: (r) => r.scheduled_depart ?? null,
            },
            {
              key: "status",
              header: t("console.transport.dispatch.col.status", undefined, "Status"),
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
