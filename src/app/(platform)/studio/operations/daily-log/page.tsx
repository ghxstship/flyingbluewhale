import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type LogRow = {
  id: string;
  log_date: string;
  status: string;
  weather_summary: string | null;
  notes: string | null;
  project: { name: string | null } | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.operations.dailyLog.eyebrow", undefined, "Operations")}
          title={t("console.operations.dailyLog.title", undefined, "Daily Log")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.operations.dailyLog.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtDate = (d: string): string =>
    fmt.dateParts(d + "T00:00:00", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("daily_logs")
    .select("id, log_date, status:log_state, weather_summary, notes, project:project_id(name)")
    .eq("org_id", session.orgId)
    .gte("log_date", since)
    .order("log_date", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as LogRow[];
  const drafts = rows.filter((r) => r.status === "draft").length;
  const submitted = rows.filter((r) => r.status === "submitted").length;
  const approved = rows.filter((r) => r.status === "approved").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.operations.dailyLog.eyebrow", undefined, "Operations")}
        title={t("console.operations.dailyLog.title", undefined, "Daily Log")}
        subtitle={t(
          "console.operations.dailyLog.subtitle",
          { count: rows.length, drafts, submitted, approved },
          `${rows.length} logs in last 30 days · ${drafts} Draft  · ${submitted} submitted · ${approved} Approved`,
        )}
        action={
          <Button href="/studio/operations/daily-log/new" size="sm">
            {t("console.operations.dailyLog.newLog", undefined, "+ New Log")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.operations.dailyLog.metric.logs30d", undefined, "Logs · 30d")}
            value={fmt.number(rows.length)}
            accent
          />
          <MetricCard
            label={t("console.operations.dailyLog.metric.pendingReview", undefined, "Pending Review")}
            value={fmt.number(submitted)}
          />
          <MetricCard
            label={t("console.operations.dailyLog.metric.approved", undefined, "Approved")}
            value={fmt.number(approved)}
          />
        </div>

        <DataView<LogRow>
          rows={rows}
          rowHref={(r) => `/studio/operations/daily-log/${r.id}`}
          emptyLabel={t("console.operations.dailyLog.emptyLabel", undefined, "No daily logs yet")}
          emptyDescription={t(
            "console.operations.dailyLog.emptyDescription",
            undefined,
            "Daily logs capture weather, manpower, equipment, deliveries, and notes per project per day.",
          )}
          emptyAction={
            <Button href="/studio/operations/daily-log/new" size="sm">
              {t("console.operations.dailyLog.newLog", undefined, "+ New Log")}
            </Button>
          }
          columns={[
            {
              key: "date",
              header: t("console.operations.dailyLog.col.date", undefined, "Date"),
              render: (r) => fmtDate(r.log_date),
              mono: true,
              accessor: (r) => r.log_date ?? null,
            },
            {
              key: "project",
              header: t("console.operations.dailyLog.col.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
            },
            {
              key: "weather",
              header: t("console.operations.dailyLog.col.weather", undefined, "Weather"),
              render: (r) => r.weather_summary ?? "—",
              accessor: (r) => r.weather_summary ?? null,
            },
            {
              key: "status",
              header: t("console.operations.dailyLog.col.status", undefined, "Status"),
              render: (r) => <Badge variant={toneFor(r.status)}>{toTitle(r.status)}</Badge>,
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
