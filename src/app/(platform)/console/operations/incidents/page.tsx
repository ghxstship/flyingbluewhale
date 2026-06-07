export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusChip, type StatusTone } from "@/components/ui/StatusChip";
import { DueDateBadge } from "@/components/ui/DueDateBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { IncidentsKanban, type IncidentKanbanRow } from "./IncidentsKanban";

const VALID_VIEWS = new Set(["list", "kanban"]);

const SEVERITY_TONE: Record<string, StatusTone> = {
  near_miss: "warning",
  minor: "info",
  major: "warning",
  critical: "danger",
};

type IncidentRow = {
  id: string;
  summary: string;
  severity: string;
  status: string;
  occurred_at: string;
  closed_at: string | null;
  location: string | null;
};

export default async function IncidentsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { t } = await getRequestT();
  const sp = await searchParams;
  const view = VALID_VIEWS.has(sp.view ?? "") ? (sp.view as "list" | "kanban") : "list";
  // closed_at column added in 20260504000010_due_date_convention.sql; the
  // supabase type generation hasn't been re-run yet so we widen via unknown.
  const { data } = await supabase
    .from("incidents")
    .select("id, summary, severity, status, occurred_at, closed_at, location")
    .eq("org_id", session.orgId)
    .order("occurred_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as unknown as IncidentRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.operations.incidents.eyebrow", undefined, "Operations")}
        title={t("console.operations.incidents.title", undefined, "Incidents")}
        subtitle={t("console.operations.incidents.subtitle", undefined, "Field-logged safety + near-miss reports.")}
        action={
          <Button href="/console/operations/incidents/new" size="sm">
            {t("console.operations.incidents.logIncident", undefined, "Log incident")}
          </Button>
        }
      />
      <div className="page-content max-w-6xl">
        <div className="mb-3 flex items-center justify-end gap-1 text-xs">
          <a
            href="?view=list"
            className={`rounded border border-[var(--p-border)] px-2 py-1 ${view === "list" ? "bg-[var(--p-surface)] text-[var(--p-text-1)]" : "text-[var(--p-text-2)]"}`}
            aria-current={view === "list" ? "true" : undefined}
          >
            {t("console.operations.incidents.viewList", undefined, "List")}
          </a>
          <a
            href="?view=kanban"
            className={`rounded border border-[var(--p-border)] px-2 py-1 ${view === "kanban" ? "bg-[var(--p-surface)] text-[var(--p-text-1)]" : "text-[var(--p-text-2)]"}`}
            aria-current={view === "kanban" ? "true" : undefined}
          >
            {t("console.operations.incidents.viewKanban", undefined, "Kanban")}
          </a>
        </div>
        {view === "kanban" ? (
          <IncidentsKanban
            rows={rows.map(
              (r): IncidentKanbanRow => ({
                id: r.id,
                summary: r.summary,
                severity: r.severity,
                status: r.status,
                occurred_at: r.occurred_at,
                closed_at: r.closed_at,
                location: r.location,
              }),
            )}
          />
        ) : (
          <DataTable<IncidentRow>
            rows={rows}
            rowHref={(r) => `/console/operations/incidents/${r.id}`}
            emptyLabel={t("console.operations.incidents.emptyLabel", undefined, "No incidents reported")}
            emptyDescription={t(
              "console.operations.incidents.emptyDescription",
              undefined,
              "Log one from the console or field-log from the mobile shell at /m/incidents/new.",
            )}
            emptyAction={
              <Button href="/console/operations/incidents/new" size="sm">
                {t("console.operations.incidents.logIncident", undefined, "Log incident")}
              </Button>
            }
            columns={[
              {
                key: "when",
                header: t("console.operations.incidents.columns.when", undefined, "When"),
                render: (r) => fmt.dateTime(r.occurred_at),
                className: "font-mono text-xs",
                accessor: (r) => r.occurred_at ?? null,
              },
              {
                key: "severity",
                header: t("console.operations.incidents.columns.severity", undefined, "Severity"),
                render: (r) => <StatusChip tone={SEVERITY_TONE[r.severity] ?? "neutral"}>{r.severity}</StatusChip>,
                filterable: true,
                groupable: true,
                accessor: (r) => r.severity ?? null,
              },
              {
                key: "summary",
                header: t("console.operations.incidents.columns.summary", undefined, "Summary"),
                render: (r) => r.summary,
                accessor: (r) => r.summary,
              },
              {
                key: "location",
                header: t("console.operations.incidents.columns.location", undefined, "Location"),
                render: (r) => r.location ?? "—",
                className: "text-[var(--p-text-2)]",
                accessor: (r) => r.location ?? null,
              },
              {
                key: "status",
                header: t("console.operations.incidents.columns.status", undefined, "Status"),
                render: (r) => (
                  <span className="inline-flex items-center gap-2">
                    <span>{r.status}</span>
                    <DueDateBadge closedAt={r.closed_at} status={r.status} iconOnly size="sm" />
                  </span>
                ),
                accessor: (r) => r.status,
                filterable: true,
                groupable: true,
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
