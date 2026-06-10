import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  topic: string;
  status: string;
  scheduled_for: string;
  conducted_at: string | null;
  briefer: { name: string | null; email: string | null } | null;
  project: { name: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success"> = {
  scheduled: "info",
  conducted: "success",
  cancelled: "muted",
};

const STATUS_LABEL_KEYS: Record<string, { key: string; fallback: string }> = {
  scheduled: { key: "console.safety.briefings.status.scheduled", fallback: "Scheduled" },
  conducted: { key: "console.safety.briefings.status.conducted", fallback: "Conducted" },
  cancelled: { key: "console.safety.briefings.status.cancelled", fallback: "Cancelled" },
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const fmtIntl = await getRequestFormatters();
  const { t } = await getRequestT();
  const { data } = await supabase
    .from("safety_briefings")
    .select(
      "id, topic, briefing_state, scheduled_for, conducted_at, briefer:briefer_id(name, email), project:project_id(name)",
    )
    .eq("org_id", session.orgId)
    .order("scheduled_for", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];
  const upcoming = rows.filter((r) => r.status === "scheduled").length;
  const conducted = rows.filter((r) => r.status === "conducted").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.briefings.eyebrow", undefined, "Safety")}
        title={t("console.safety.briefings.title", undefined, "Safety Briefings")}
        subtitle={t("console.safety.briefings.subtitle", undefined, "Pre-shift toolbox talks.")}
        action={
          <Button href="/console/safety/briefings/new" size="sm">
            {t("console.safety.briefings.scheduleAction", undefined, "+ Schedule briefing")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.safety.briefings.metrics.upcoming", undefined, "Upcoming")}
            value={fmtIntl.number(upcoming)}
            accent
          />
          <MetricCard
            label={t("console.safety.briefings.metrics.conducted", undefined, "Conducted")}
            value={fmtIntl.number(conducted)}
          />
          <MetricCard
            label={t("console.safety.briefings.metrics.total", undefined, "Total")}
            value={fmtIntl.number(rows.length)}
          />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/safety/briefings/${r.id}`}
          emptyLabel={t("console.safety.briefings.emptyLabel", undefined, "No briefings scheduled")}
          emptyDescription={t(
            "console.safety.briefings.emptyDescription",
            undefined,
            "Schedule a daily / pre-shift safety briefing. Crew acknowledges via mobile.",
          )}
          emptyAction={
            <Button href="/console/safety/briefings/new" size="sm">
              {t("console.safety.briefings.scheduleAction", undefined, "+ Schedule briefing")}
            </Button>
          }
          columns={[
            {
              key: "topic",
              header: t("console.safety.briefings.columns.topic", undefined, "Topic"),
              render: (r) => r.topic,
              accessor: (r) => r.topic,
            },
            {
              key: "project",
              header: t("console.safety.briefings.columns.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
            },
            {
              key: "briefer",
              header: t("console.safety.briefings.columns.briefer", undefined, "Briefer"),
              render: (r) => r.briefer?.name ?? r.briefer?.email ?? "—",
              accessor: (r) => r.briefer?.name ?? r.briefer?.email ?? null,
            },
            {
              key: "scheduled",
              header: t("console.safety.briefings.columns.scheduled", undefined, "Scheduled"),
              render: (r) => fmt(r.scheduled_for),
              className: "font-mono text-xs",
              accessor: (r) => r.scheduled_for ?? null,
            },
            {
              key: "status",
              header: t("console.safety.briefings.columns.status", undefined, "Status"),
              render: (r) => {
                const label = STATUS_LABEL_KEYS[r.status];
                return (
                  <Badge variant={STATUS_TONE[r.status] ?? "muted"}>
                    {label ? t(label.key, undefined, label.fallback) : r.status}
                  </Badge>
                );
              },
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
