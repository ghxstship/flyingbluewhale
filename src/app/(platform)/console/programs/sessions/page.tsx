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
  project: { name: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  draft: "muted",
  scheduled: "info",
  live: "success",
  complete: "muted",
  cancelled: "error",
};

const SESSION_PATTERN = /(session|heat|round|qualif|semi|final|medal|prelim)/i;

function fmt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Programs" title="Sessions" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const since = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("events")
    .select("id, name, starts_at, ends_at, status, project:project_id(name)")
    .eq("org_id", session.orgId)
    .gte("starts_at", since)
    .order("starts_at", { ascending: true })
    .limit(500);

  const all = (data ?? []) as unknown as EventRow[];
  const rows = all.filter((e) => SESSION_PATTERN.test(e.name));

  return (
    <>
      <ModuleHeader
        eyebrow="Programs"
        title="Sessions"
        subtitle={`${rows.length} session${rows.length === 1 ? "" : "s"} — heats, rounds, medal sessions`}
        action={
          <Button href="/console/events/new" size="sm">
            + New Event
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<EventRow>
          rows={rows}
          rowHref={(r) => `/console/events/${r.id}`}
          emptyLabel="No sessions"
          emptyDescription="Sessions live as Events with names like 'Heat 3 · 100m', 'Semi-final', 'Medal session'. This view filters automatically."
          emptyAction={
            <Button href="/console/events/new" size="sm">
              + New Event
            </Button>
          }
          columns={[
            { key: "name", header: "Session", render: (r) => r.name },
            { key: "starts", header: "Starts", render: (r) => fmt(r.starts_at), className: "font-mono text-xs" },
            { key: "ends", header: "Ends", render: (r) => fmt(r.ends_at), className: "font-mono text-xs" },
            { key: "project", header: "Project", render: (r) => r.project?.name ?? "—" },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status}</Badge>,
            },
          ]}
        />
      </div>
    </>
  );
}
