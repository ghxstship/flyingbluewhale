import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { DueDateBadge } from "@/components/ui/DueDateBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { PunchKanban, type PunchKanbanRow } from "./PunchKanban";

export const dynamic = "force-dynamic";

const VALID_VIEWS = new Set(["list", "kanban"]);

type Row = {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  due_at: string | null;
  closed_at: string | null;
  show_ready_gate: boolean;
  project: { name: string | null } | null;
  assignee: { name: string | null; email: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  open: "warning",
  in_progress: "info",
  ready_for_review: "info",
  complete: "success",
  void: "muted",
};
const PRIORITY_TONE: Record<string, "muted" | "info" | "warning" | "error"> = {
  low: "muted",
  normal: "info",
  high: "warning",
  urgent: "error",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Operations" title="Punch List" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const sp = await searchParams;
  const view = VALID_VIEWS.has(sp.view ?? "") ? (sp.view as "list" | "kanban") : "list";

  function fmtDate(d: string | null): string {
    if (!d) return "—";
    return fmt.dateParts(d + "T00:00:00", { month: "short", day: "numeric" });
  }
  const { data } = await supabase
    .from("punch_items")
    .select(
      "id, code, title, status, priority, due_at, closed_at, show_ready_gate, project:project_id(name), assignee:assignee_id(name, email)",
    )
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];
  const open = rows.filter((r) => !["complete", "void"].includes(r.status)).length;
  const showReady = rows.filter((r) => r.show_ready_gate && !["complete", "void"].includes(r.status)).length;
  const urgent = rows.filter((r) => r.priority === "urgent" && !["complete", "void"].includes(r.status)).length;

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        title="Punch List"
        subtitle="Show-ready checklist."
        action={
          <Button href="/console/punch/new" size="sm">
            + New Item
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Open" value={fmt.number(open)} accent />
          <MetricCard label="Show-ready gates" value={fmt.number(showReady)} />
          <MetricCard label="Urgent" value={fmt.number(urgent)} />
        </div>
        <div className="flex items-center justify-end gap-1 text-xs">
          <a
            href="?view=list"
            className={`rounded border border-[var(--border-color)] px-2 py-1 ${view === "list" ? "bg-[var(--surface-raised)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
            aria-current={view === "list" ? "true" : undefined}
          >
            List
          </a>
          <a
            href="?view=kanban"
            className={`rounded border border-[var(--border-color)] px-2 py-1 ${view === "kanban" ? "bg-[var(--surface-raised)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
            aria-current={view === "kanban" ? "true" : undefined}
          >
            Kanban
          </a>
        </div>
        {view === "kanban" ? (
          <PunchKanban
            rows={rows.map(
              (r): PunchKanbanRow => ({
                id: r.id,
                code: r.code,
                title: r.title,
                status: r.status as PunchKanbanRow["status"],
                priority: r.priority as PunchKanbanRow["priority"],
                due_at: r.due_at,
                closed_at: r.closed_at,
                show_ready_gate: r.show_ready_gate,
              }),
            )}
          />
        ) : (
          <DataTable<Row>
            rows={rows}
            rowHref={(r) => `/console/punch/${r.id}`}
            emptyLabel="No punch items"
            emptyDescription="Punch items capture show-ready gaps. Add one per gap; gate the doors-open milestone behind closure."
            emptyAction={
              <Button href="/console/punch/new" size="sm">
                + New Item
              </Button>
            }
            columns={[
              {
                key: "code",
                header: "Code",
                render: (r) => r.code,
                className: "font-mono text-xs",
                accessor: (r) => r.code,
              },
              {
                key: "title",
                header: "Title",
                render: (r) => (
                  <div className="flex items-center gap-2">
                    {r.show_ready_gate && (
                      <span
                        title="Show-ready gate"
                        className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-error)]"
                      />
                    )}
                    <span>{r.title}</span>
                  </div>
                ),
                accessor: (r) => r.show_ready_gate ?? null,
              },
              {
                key: "project",
                header: "Project",
                render: (r) => r.project?.name ?? "—",
                accessor: (r) => r.project?.name ?? null,
              },
              {
                key: "assignee",
                header: "Assignee",
                render: (r) => r.assignee?.name ?? r.assignee?.email ?? "—",
                filterable: true,
                groupable: true,
                accessor: (r) => r.assignee?.name ?? r.assignee?.email ?? null,
              },
              {
                key: "due",
                header: "Due",
                render: (r) => fmtDate(r.due_at),
                className: "font-mono text-xs",
                accessor: (r) => r.due_at ?? null,
              },
              {
                key: "priority",
                header: "Priority",
                render: (r) => <Badge variant={PRIORITY_TONE[r.priority] ?? "muted"}>{toTitle(r.priority)}</Badge>,
                accessor: (r) => r.priority ?? null,
                filterable: true,
                groupable: true,
              },
              {
                key: "status",
                header: "Status",
                render: (r) => (
                  <span className="inline-flex items-center gap-2">
                    <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>
                    <DueDateBadge dueAt={r.due_at} closedAt={r.closed_at} status={r.status} iconOnly size="sm" />
                  </span>
                ),
                filterable: true,
                groupable: true,
                accessor: (r) => r.status.replace ?? null,
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
