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
          eyebrow={t("console.workforce.deployment.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.workforce.deployment.title", undefined, "Deployment")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.deployment.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.workforce.deployment.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.deployment.title", undefined, "Deployment")}
        subtitle={
          rows.length === 1
            ? t("console.workforce.deployment.subtitleOne", { count: rows.length }, `${rows.length} Record`)
            : t("console.workforce.deployment.subtitleMany", { count: rows.length }, `${rows.length} Records`)
        }
        action={
          <Button href="/studio/workforce/deployment/new" size="sm">
            {t("console.workforce.deployment.planDeployment", undefined, "+ Plan deployment")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/studio/workforce/deployment/${r.id}`}
          emptyLabel={t("console.workforce.deployment.emptyLabel", undefined, "No deployments planned")}
          emptyDescription={t(
            "console.workforce.deployment.emptyDescription",
            undefined,
            "Per-area FTE planning and run-time variance tracked against the workforce plan.",
          )}
          emptyAction={
            <Button href="/studio/workforce/deployment/new" size="sm">
              {t("console.workforce.deployment.planDeployment", undefined, "+ Plan deployment")}
            </Button>
          }
          columns={[
            {
              key: "functional_area",
              header: t("console.workforce.deployment.columns.area", undefined, "Area"),
              render: (r) => String(r.functional_area ?? "—"),
              accessor: (r) => r.functional_area ?? null,
            },
            {
              key: "planned_fte",
              header: t("console.workforce.deployment.columns.planned", undefined, "Planned"),
              render: (r) => <span className="font-mono text-xs">{String(r.planned_fte ?? "—")}</span>,
              accessor: (r) => r.planned_fte ?? null,
            },
            {
              key: "actual_fte",
              header: t("console.workforce.deployment.columns.actual", undefined, "Actual"),
              render: (r) => <span className="font-mono text-xs">{String(r.actual_fte ?? "—")}</span>,
              accessor: (r) => r.actual_fte ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
