import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
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

const PRESS_PATTERN = /(press[ -]?conference|pressconf|press[ -]?brief|media[ -]?brief|presser)/i;

function fmt(iso: string): string {
  return formatDateParts(iso, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Programs" title="Press Conferences" />
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
    .select("id, name, starts_at, ends_at, status, project:project_id(name)")
    .eq("org_id", session.orgId)
    .gte("starts_at", since)
    .order("starts_at", { ascending: true })
    .limit(500);

  const all = (data ?? []) as unknown as EventRow[];
  const rows = all.filter((e) => PRESS_PATTERN.test(e.name));

  return (
    <>
      <ModuleHeader
        eyebrow="Programs"
        title="Press Conferences"
        subtitle={`${rows.length} press conference${rows.length === 1 ? "" : "s"}`}
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
          emptyLabel="No press conferences"
          emptyDescription="Press conferences are Events with 'press' or 'media briefing' in the name. Create one and accredited media will see it on the project portal."
          emptyAction={
            <Button href="/console/events/new" size="sm">
              + New Event
            </Button>
          }
          columns={[
            { key: "name", header: "Briefing", render: (r) => r.name, accessor: (r) => r.name },
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
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>,
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
