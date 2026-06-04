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
  const rows = await listOrgScoped("environmental_events", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.environmental.eyebrow", undefined, "Safety")}
        title={t("console.safety.environmental.title", undefined, "Environmental Events")}
        subtitle={
          rows.length === 1
            ? t("console.safety.environmental.subtitleOne", { count: rows.length }, `${rows.length} Record`)
            : t("console.safety.environmental.subtitleMany", { count: rows.length }, `${rows.length} Records`)
        }
        action={
          <Button href="/console/safety/environmental/new" size="sm">
            {t("console.safety.environmental.logEvent", undefined, "+ Log event")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/safety/environmental/${r.id}`}
          emptyLabel={t("console.safety.environmental.emptyLabel", undefined, "No environmental events")}
          emptyDescription={t(
            "console.safety.environmental.emptyDescription",
            undefined,
            "Heat/cold/wind/storm windows and wildlife/biohazard incidents — drives op-pause + protocol triggers.",
          )}
          emptyAction={
            <Button href="/console/safety/environmental/new" size="sm">
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
      </div>
    </>
  );
}
