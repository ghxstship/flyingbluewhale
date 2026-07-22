import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { PagerNav } from "@/components/ui/PagerNav";
import { requireSession } from "@/lib/auth";
import { listOrgScopedPage } from "@/lib/db/resource";
import { parsePage } from "@/lib/db/pagination";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("workforce_deployments", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    pageSize,
    cursor: String(offset),
  });
  const rows = result.rows;
  const total = result.totalCount;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.deployment.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.deployment.title", undefined, "Deployment")}
        subtitle={
          total === 1
            ? t("console.workforce.deployment.subtitleOne", { count: total }, `${total} Record`)
            : t("console.workforce.deployment.subtitleMany", { count: total }, `${total} Records`)
        }
        action={
          <div className="flex items-center gap-2">
            <Button href="/studio/operations/schedule?lane=crew&group=location" size="sm" variant="secondary">
              {t("console.workforce.deployment.openSchedule", undefined, "Open in Schedule")}
            </Button>
            <Button href="/studio/workforce/deployment/new" size="sm">
              {t("console.workforce.deployment.planDeployment", undefined, "+ Plan deployment")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-3">
        <DataView
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
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
              render: (r) => String(r.planned_fte ?? "—"),
              mono: true,
              accessor: (r) => r.planned_fte ?? null,
            },
            {
              key: "actual_fte",
              header: t("console.workforce.deployment.columns.actual", undefined, "Actual"),
              render: (r) => String(r.actual_fte ?? "—"),
              mono: true,
              accessor: (r) => r.actual_fte ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/workforce/deployment"
          searchParams={sp}
        />
      </div>
    </>
  );
}
