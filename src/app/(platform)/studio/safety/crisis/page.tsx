import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { PagerNav } from "@/components/ui/PagerNav";
import { requireSession } from "@/lib/auth";
import { listOrgScopedPage } from "@/lib/db/resource";
import { parsePage } from "@/lib/db/pagination";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { SEVERITY_TONE } from "@/lib/tones";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t } = await getRequestT();
  const SEVERITY_LABEL: Record<string, string> = {
    info: t("console.safety.crisis.severity.info", undefined, "Info"),
    warn: t("console.safety.crisis.severity.warn", undefined, "Warning"),
    critical: t("console.safety.crisis.severity.critical", undefined, "Critical"),
  };

  if (!hasSupabase)
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.safety.crisis.eyebrow", undefined, "Workspace")}
          title={t("console.safety.crisis.title", undefined, "Crisis Alerts")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.safety.crisis.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("crisis_alerts", session.orgId, {
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
        eyebrow={t("console.safety.crisis.eyebrow", undefined, "Workspace")}
        title={t("console.safety.crisis.title", undefined, "Crisis Alerts")}
        subtitle={`${total} ${total === 1 ? t("console.safety.crisis.recordSingular", undefined, "Record") : t("console.safety.crisis.recordPlural", undefined, "Records")}`}
        action={
          <Button href="/studio/safety/crisis/new" size="sm">
            {t("console.safety.crisis.activateAlert", undefined, "+ Activate alert")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          rowHref={(r) => `/studio/safety/crisis/${r.id}`}
          emptyLabel={t("console.safety.crisis.emptyLabel", undefined, "No crisis alerts")}
          emptyDescription={t(
            "console.safety.crisis.emptyDescription",
            undefined,
            "Activated alerts page leadership and route to the major-incident plan when severity warrants.",
          )}
          columns={[
            {
              key: "title",
              header: t("console.safety.crisis.col.title", undefined, "Title"),
              render: (r) => String(r.title ?? "—"),
              accessor: (r) => r.title ?? null,
            },
            {
              key: "severity",
              header: t("console.safety.crisis.col.severity", undefined, "Severity"),
              render: (r) => {
                const sev = String(r.severity ?? "");
                if (!sev) return "—";
                return <Badge variant={SEVERITY_TONE[sev] ?? "default"}>{SEVERITY_LABEL[sev] ?? sev}</Badge>;
              },
              accessor: (r) => r.severity ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "sent_at",
              header: t("console.safety.crisis.col.sent", undefined, "Sent"),
              render: (r) => <span className="font-mono text-xs">{String(r.sent_at ?? "—")}</span>,
              accessor: (r) => r.sent_at ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/safety/crisis"
          searchParams={sp}
        />
      </div>
    </>
  );
}
