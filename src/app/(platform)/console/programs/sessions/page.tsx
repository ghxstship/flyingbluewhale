import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.programs.sessions.eyebrow", undefined, "Programs")}
          title={t("console.programs.sessions.title", undefined, "Sessions")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.programs.sessions.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const since = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("events")
    .select("id, name, starts_at, ends_at, status:event_state, project:project_id(name)")
    .eq("org_id", session.orgId)
    .gte("starts_at", since)
    .order("starts_at", { ascending: true })
    .limit(500);

  const all = (data ?? []) as unknown as EventRow[];
  const rows = all.filter((e) => SESSION_PATTERN.test(e.name));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.programs.sessions.eyebrow", undefined, "Programs")}
        title={t("console.programs.sessions.title", undefined, "Sessions")}
        subtitle={t(
          "console.programs.sessions.subtitle",
          { count: rows.length, plural: rows.length === 1 ? "" : "s" },
          `${rows.length} session${rows.length === 1 ? "" : "s"} — heats, rounds, medal sessions`,
        )}
        action={
          <Button href="/console/events/new" size="sm">
            {t("console.programs.sessions.newEvent", undefined, "+ New Event")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<EventRow>
          rows={rows}
          rowHref={(r) => `/console/events/${r.id}`}
          emptyLabel={t("console.programs.sessions.emptyLabel", undefined, "No sessions")}
          emptyDescription={t(
            "console.programs.sessions.emptyDescription",
            undefined,
            "Sessions live as Events with names like 'Heat 3 · 100m', 'Semi-final', 'Medal session'. This view filters automatically.",
          )}
          emptyAction={
            <Button href="/console/events/new" size="sm">
              {t("console.programs.sessions.newEvent", undefined, "+ New Event")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.programs.sessions.col.session", undefined, "Session"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "starts",
              header: t("console.programs.sessions.col.starts", undefined, "Starts"),
              render: (r) => fmt(r.starts_at),
              className: "font-mono text-xs",
              accessor: (r) => r.starts_at ?? null,
            },
            {
              key: "ends",
              header: t("console.programs.sessions.col.ends", undefined, "Ends"),
              render: (r) => fmt(r.ends_at),
              className: "font-mono text-xs",
              accessor: (r) => r.ends_at ?? null,
            },
            {
              key: "project",
              header: t("console.programs.sessions.col.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
            },
            {
              key: "status",
              header: t("console.programs.sessions.col.status", undefined, "Status"),
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
