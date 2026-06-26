import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
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
          eyebrow={t("console.safety.environmental.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.safety.environmental.title", undefined, "Environmental Events")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.safety.environmental.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("environmental_events", session.orgId, {
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
        eyebrow={t("console.safety.environmental.eyebrow", undefined, "Safety")}
        title={t("console.safety.environmental.title", undefined, "Environmental Events")}
        subtitle={
          total === 1
            ? t("console.safety.environmental.subtitleOne", { count: total }, `${total} Record`)
            : t("console.safety.environmental.subtitleMany", { count: total }, `${total} Records`)
        }
        action={
          <Button href="/studio/safety/environmental/new" size="sm">
            {t("console.safety.environmental.logEvent", undefined, "+ Log event")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          rowHref={(r) => `/studio/safety/environmental/${r.id}`}
          emptyLabel={t("console.safety.environmental.emptyLabel", undefined, "No environmental events")}
          emptyDescription={t(
            "console.safety.environmental.emptyDescription",
            undefined,
            "Heat/cold/wind/storm windows and wildlife/biohazard incidents — drives op-pause + protocol triggers.",
          )}
          emptyAction={
            <Button href="/studio/safety/environmental/new" size="sm">
              {t("console.safety.environmental.logEvent", undefined, "+ Log event")}
            </Button>
          }
          columns={[
            {
              key: "kind",
              header: t("console.safety.environmental.columns.kind", undefined, "Kind"),
              render: (r) => String(r.kind ?? "—"),
              accessor: (r) => r.kind ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "severity",
              header: t("console.safety.environmental.columns.severity", undefined, "Severity"),
              render: (r) => String(r.severity ?? "—"),
              accessor: (r) => r.severity ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "started_at",
              header: t("console.safety.environmental.columns.started", undefined, "Started"),
              render: (r) => <span className="font-mono text-xs">{String(r.started_at ?? "—")}</span>,
              accessor: (r) => r.started_at ?? null,
            },
            {
              key: "ended_at",
              header: t("console.safety.environmental.columns.ended", undefined, "Ended"),
              render: (r) => <span className="font-mono text-xs">{String(r.ended_at ?? "—")}</span>,
              accessor: (r) => r.ended_at ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/safety/environmental"
          searchParams={sp}
        />
      </div>
    </>
  );
}
