import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { formatDateParts } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  project: { name: string | null } | null;
};

function fmt(iso: string): string {
  return formatDateParts(new Date(iso), {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.programs.schedule.eyebrow", undefined, "Programs")}
          title={t("console.programs.schedule.title", undefined, "Master Schedule")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.programs.schedule.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const horizon = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("events")
    .select("id, name, starts_at, ends_at, status:event_state, project:project_id(name)")
    .eq("org_id", session.orgId)
    .gte("starts_at", since)
    .lt("starts_at", horizon)
    .order("starts_at", { ascending: true })
    .limit(500);

  const rows = (data ?? []) as unknown as EventRow[];
  const live = rows.filter((r) => r.status === "live").length;
  const upcoming = rows.filter((r) => new Date(r.starts_at).getTime() >= Date.now()).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.programs.schedule.eyebrow", undefined, "Programs")}
        title={t("console.programs.schedule.title", undefined, "Master Schedule")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.programs.schedule.eventSingular", undefined, "Event") : t("console.programs.schedule.eventPlural", undefined, "Events")} · ${upcoming} ${t("console.programs.schedule.upcoming", undefined, "Upcoming")} · ${live} ${t("console.programs.schedule.live", undefined, "Live")}`}
        action={
          <div className="flex items-center gap-2">
            <Button
              href="/studio/operations/schedule?kind=rehearsal,sound_check,changeover,run_of_show"
              size="sm"
              variant="secondary"
            >
              {t("console.programs.schedule.openTimeline", undefined, "Open in Timeline")}
            </Button>
            <Button href="/studio/events/new" size="sm">
              {t("console.programs.schedule.newEvent", undefined, "+ New Event")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.programs.schedule.metricTotal", undefined, "Total")}
            value={fmtIntl.number(rows.length)}
            accent
          />
          <MetricCard
            label={t("console.programs.schedule.metricUpcoming", undefined, "Upcoming")}
            value={fmtIntl.number(upcoming)}
          />
          <MetricCard
            label={t("console.programs.schedule.metricLiveNow", undefined, "Live Now")}
            value={fmtIntl.number(live)}
          />
        </div>

        <DataTable<EventRow>
          rows={rows}
          rowHref={(r) => `/studio/events/${r.id}`}
          emptyLabel={t("console.programs.schedule.emptyLabel", undefined, "No events in window")}
          emptyDescription={t(
            "console.programs.schedule.emptyDescription",
            undefined,
            "Author events under Console → Events. The master schedule rolls up the next 90 days across all projects.",
          )}
          emptyAction={
            <Button href="/studio/events/new" size="sm">
              {t("console.programs.schedule.newEvent", undefined, "+ New Event")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.programs.schedule.colEvent", undefined, "Event"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "starts",
              header: t("console.programs.schedule.colStarts", undefined, "Starts"),
              render: (r) => fmt(r.starts_at),
              className: "font-mono text-xs",
              accessor: (r) => r.starts_at ?? null,
            },
            {
              key: "ends",
              header: t("console.programs.schedule.colEnds", undefined, "Ends"),
              render: (r) => fmt(r.ends_at),
              className: "font-mono text-xs",
              accessor: (r) => r.ends_at ?? null,
            },
            {
              key: "project",
              header: t("console.programs.schedule.colProject", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
            },
            {
              key: "status",
              header: t("console.programs.schedule.colStatus", undefined, "Status"),
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
