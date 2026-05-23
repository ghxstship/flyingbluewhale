import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  description: string | null;
  project: { name: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  draft: "muted",
  scheduled: "info",
  live: "success",
  complete: "muted",
  cancelled: "error",
};

const MEETING_PATTERN =
  /(meet|brief|sync|standup|review|coordination|liaison|interface|chef|kickoff|kick-off|debrief|technical)/i;

function fmt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workspace" title="Meetings" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("events")
    .select("id, name, starts_at, ends_at, status, description, project:project_id(name)")
    .eq("org_id", session.orgId)
    .gte("starts_at", since)
    .order("starts_at", { ascending: true })
    .limit(500);
  const all = (data ?? []) as unknown as EventRow[];
  const meetings = all.filter(
    (e) => MEETING_PATTERN.test(e.name) || (e.description ? MEETING_PATTERN.test(e.description) : false),
  );
  const upcoming = meetings.filter((e) => new Date(e.starts_at).getTime() >= Date.now()).length;

  return (
    <>
      <ModuleHeader
        eyebrow="Workspace"
        title="Meetings"
        subtitle={`${meetings.length} Meeting${meetings.length === 1 ? "" : "s"}${upcoming ? ` · ${upcoming} upcoming` : ""}`}
        action={
          <Button href="/console/events/new" size="sm">
            + New Event
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<EventRow>
          rows={meetings}
          rowHref={(r) => `/console/events/${r.id}`}
          emptyLabel="No meetings"
          emptyDescription="Technical meetings, Chef-de-Mission interfaces, team-leader briefings. Author them as Events with a meeting-style name; this view filters automatically."
          emptyAction={
            <Button href="/console/events/new" size="sm">
              + New Event
            </Button>
          }
          columns={[
            { key: "name", header: "Name", render: (r) => r.name, accessor: (r) => r.name },
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
