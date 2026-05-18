import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { formatDateParts } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  project: { name: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  draft: "muted",
  scheduled: "info",
  live: "success",
  complete: "muted",
  cancelled: "error",
};

function fmt(iso: string): string {
  return formatDateParts(iso, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Programs" title="Master Schedule" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
    .select("id, name, starts_at, ends_at, status, project:project_id(name)")
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
        eyebrow="Programs"
        title="Master Schedule"
        subtitle={`${rows.length} event${rows.length === 1 ? "" : "s"} · ${upcoming} upcoming · ${live} live`}
        action={
          <Button href="/console/events/new" size="sm">
            + New Event
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Total" value={fmtIntl.number(rows.length)} accent />
          <MetricCard label="Upcoming" value={fmtIntl.number(upcoming)} />
          <MetricCard label="Live Now" value={fmtIntl.number(live)} />
        </div>

        <DataTable<EventRow>
          rows={rows}
          rowHref={(r) => `/console/events/${r.id}`}
          emptyLabel="No events in window"
          emptyDescription="Author events under Console → Events. The master schedule rolls up the next 90 days across all projects."
          emptyAction={
            <Button href="/console/events/new" size="sm">
              + New Event
            </Button>
          }
          columns={[
            { key: "name", header: "Event", render: (r) => r.name, accessor: (r) => r.name },
            {
              key: "starts",
              header: "Starts",
              render: (r) => fmt(r.starts_at),
              className: "font-mono text-xs",
              accessor: (r) => r.starts_at ?? null,
            },
            {
              key: "ends",
              header: "Ends",
              render: (r) => fmt(r.ends_at),
              className: "font-mono text-xs",
              accessor: (r) => r.ends_at ?? null,
            },
            {
              key: "project",
              header: "Project",
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status}</Badge>,
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
