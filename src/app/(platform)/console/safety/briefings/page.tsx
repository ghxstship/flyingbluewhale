import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

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
  const { data } = await supabase
    .from("safety_briefings")
    .select("id, topic, status, scheduled_for, conducted_at, briefer:briefer_id(name, email), project:project_id(name)")
    .eq("org_id", session.orgId)
    .order("scheduled_for", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];
  const upcoming = rows.filter((r) => r.status === "scheduled").length;
  const conducted = rows.filter((r) => r.status === "conducted").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Safety"
        title="Safety Briefings"
        subtitle="Pre-shift toolbox talks. Capture attendance + acknowledgments via mobile."
        action={
          <Button href="/console/safety/briefings/new" size="sm">
            + Schedule briefing
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Upcoming" value={upcoming.toLocaleString()} accent />
          <MetricCard label="Conducted" value={conducted.toLocaleString()} />
          <MetricCard label="Total" value={rows.length.toLocaleString()} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/safety/briefings/${r.id}`}
          emptyLabel="No briefings scheduled"
          emptyDescription="Schedule a daily / pre-shift safety briefing. Crew acknowledges via mobile."
          emptyAction={
            <Button href="/console/safety/briefings/new" size="sm">
              + Schedule briefing
            </Button>
          }
          columns={[
            { key: "topic", header: "Topic", render: (r) => r.topic, accessor: (r) => r.topic },
            { key: "project", header: "Project", render: (r) => r.project?.name ?? "—" },
            { key: "briefer", header: "Briefer", render: (r) => r.briefer?.name ?? r.briefer?.email ?? "—" },
            {
              key: "scheduled",
              header: "Scheduled",
              render: (r) => fmt(r.scheduled_for),
              className: "font-mono text-xs",
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
