import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

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

const CEREMONY_PATTERN = /(ceremony|ceremon|opening|closing|victory|medal|mixed[ -]?zone|torch|flame)/i;

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
          eyebrow={t("console.programs.ceremonies.eyebrow", undefined, "Programs")}
          title={t("console.programs.ceremonies.title", undefined, "Ceremonies")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.programs.ceremonies.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("events")
    .select("id, name, starts_at, ends_at, event_state, project:project_id(name)")
    .eq("org_id", session.orgId)
    .gte("starts_at", since)
    .order("starts_at", { ascending: true })
    .limit(500);

  const all = (data ?? []) as unknown as EventRow[];
  const rows = all.filter((e) => CEREMONY_PATTERN.test(e.name));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.programs.ceremonies.eyebrow", undefined, "Programs")}
        title={t("console.programs.ceremonies.title", undefined, "Ceremonies")}
        subtitle={t(
          rows.length === 1 ? "console.programs.ceremonies.subtitle.one" : "console.programs.ceremonies.subtitle.other",
          { count: rows.length },
          `${rows.length} ceremon${rows.length === 1 ? "y" : "ies"} — opening, closing, victory, mixed-zone`,
        )}
        action={
          <Button href="/console/production/ros" size="sm">
            {t("console.programs.ceremonies.openRunOfShow", undefined, "Open Run of Show")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<EventRow>
          rows={rows}
          rowHref={(r) => `/console/events/${r.id}`}
          emptyLabel={t("console.programs.ceremonies.emptyLabel", undefined, "No ceremonies")}
          emptyDescription={t(
            "console.programs.ceremonies.emptyDescription",
            undefined,
            "Ceremonies live as Events with names like 'Opening ceremony', 'Closing ceremony', 'Victory ceremony · 100m'. Author cues in Production → Run of Show.",
          )}
          columns={[
            {
              key: "name",
              header: t("console.programs.ceremonies.columns.ceremony", undefined, "Ceremony"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "starts",
              header: t("console.programs.ceremonies.columns.starts", undefined, "Starts"),
              render: (r) => fmt(r.starts_at),
              className: "font-mono text-xs",
              accessor: (r) => r.starts_at ?? null,
            },
            {
              key: "ends",
              header: t("console.programs.ceremonies.columns.ends", undefined, "Ends"),
              render: (r) => fmt(r.ends_at),
              className: "font-mono text-xs",
              accessor: (r) => r.ends_at ?? null,
            },
            {
              key: "project",
              header: t("console.programs.ceremonies.columns.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
            },
            {
              key: "status",
              header: t("console.programs.ceremonies.columns.status", undefined, "Status"),
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
