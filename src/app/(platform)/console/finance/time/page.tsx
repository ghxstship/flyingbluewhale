import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import type { TimeEntry } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function fmtMinutes(m: number | null) {
  if (!m) return "—";
  const h = Math.floor(m / 60),
    mm = m % 60;
  return `${h}h ${mm}m`;
}

export default async function TimePage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.finance.time.title", undefined, "Time Tracking")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.time.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("time_entries", session.orgId, { orderBy: "started_at" });
  const totalMin = rows.reduce((s, r) => s + (r.duration_minutes ?? 0), 0);
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.time.eyebrow", undefined, "Finance")}
        title={t("console.finance.time.title", undefined, "Time Tracking")}
        subtitle={t(
          "console.finance.time.subtitle",
          { count: rows.length, duration: fmtMinutes(totalMin) },
          `${rows.length} Entries  · ${fmtMinutes(totalMin)} logged`,
        )}
        action={
          <Button href="/console/finance/time/new">
            {t("console.finance.time.newEntry", undefined, "+ New Entry")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<TimeEntry>
          rows={rows}
          rowHref={(r) => `/console/finance/time/${r.id}`}
          emptyLabel={t("console.finance.time.emptyLabel", undefined, "No time entries")}
          emptyDescription={t(
            "console.finance.time.emptyDescription",
            undefined,
            "Track billable + non-billable work for invoices and labour cost reporting.",
          )}
          emptyAction={
            <Button href="/console/finance/time/new" size="sm">
              {t("console.finance.time.newEntry", undefined, "+ New Entry")}
            </Button>
          }
          columns={[
            {
              key: "description",
              header: t("console.finance.time.columns.description", undefined, "Description"),
              render: (r) => r.description ?? "—",
              accessor: (r) => r.description ?? null,
            },
            {
              key: "duration",
              header: t("console.finance.time.columns.duration", undefined, "Duration"),
              render: (r) => fmtMinutes(r.duration_minutes),
              className: "font-mono text-xs",
              accessor: (r) => r.duration_minutes ?? null,
            },
            {
              key: "billable",
              header: t("console.finance.time.columns.billable", undefined, "Billable"),
              render: (r) =>
                r.billable ? (
                  <Badge variant="success">{t("common.yes", undefined, "Yes")}</Badge>
                ) : (
                  <Badge variant="muted">{t("common.no", undefined, "No")}</Badge>
                ),
              accessor: (r) => r.billable ?? null,
            },
            {
              key: "started",
              header: t("console.finance.time.columns.started", undefined, "Started"),
              render: (r) => timeAgo(r.started_at),
              className: "font-mono text-xs",
              accessor: (r) => r.started_at,
            },
          ]}
        />
      </div>
    </>
  );
}
