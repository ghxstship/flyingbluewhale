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
          eyebrow={t("console.safety.majorIncident.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.safety.majorIncident.title", undefined, "Major Incidents")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.safety.majorIncident.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("major_incidents", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.majorIncident.eyebrow", undefined, "Safety")}
        title={t("console.safety.majorIncident.title", undefined, "Major Incidents")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.safety.majorIncident.recordSingular", undefined, "Record") : t("console.safety.majorIncident.recordPlural", undefined, "Records")}`}
        action={
          <Button href="/console/safety/major-incident/new" size="sm">
            {t("console.safety.majorIncident.activatePlan", undefined, "+ Activate plan")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/safety/major-incident/${r.id}`}
          emptyLabel={t("console.safety.majorIncident.emptyLabel", undefined, "No major incidents")}
          emptyDescription={t(
            "console.safety.majorIncident.emptyDescription",
            undefined,
            "Open a record when a major-incident plan is activated; the timeline tracks decisions and status changes.",
          )}
          emptyAction={
            <Button href="/console/safety/major-incident/new" size="sm">
              {t("console.safety.majorIncident.activatePlan", undefined, "+ Activate plan")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.safety.majorIncident.columns.name", undefined, "Name"),
              render: (r) => String(r.name ?? "—"),
              accessor: (r) => r.name ?? null,
            },
            {
              key: "status",
              header: t("console.safety.majorIncident.columns.status", undefined, "Status"),
              render: (r) => String(r.status ?? "—"),
              accessor: (r) => r.status ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "opened_at",
              header: t("console.safety.majorIncident.columns.opened", undefined, "Opened"),
              render: (r) => <span className="font-mono text-xs">{String(r.opened_at ?? "—")}</span>,
              accessor: (r) => r.opened_at ?? null,
            },
            {
              key: "closed_at",
              header: t("console.safety.majorIncident.columns.closed", undefined, "Closed"),
              render: (r) => <span className="font-mono text-xs">{String(r.closed_at ?? "—")}</span>,
              accessor: (r) => r.closed_at ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
