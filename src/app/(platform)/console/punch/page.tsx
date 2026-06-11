import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { DueDateBadge } from "@/components/ui/DueDateBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { PunchKanban, type PunchKanbanRow } from "./PunchKanban";
import { PRIORITY_TONE, toneFor } from "@/lib/tones";

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

export default async function Page({ searchParams }: { searchParams: Promise<{ view?: string; list?: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.punch.eyebrow", undefined, "Operations")}
          title={t("console.punch.title", undefined, "Punch List")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.punch.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const sp = await searchParams;
  const view = VALID_VIEWS.has(sp.view ?? "") ? (sp.view as "list" | "kanban") : "list";
  // List filter: ?list=<uuid> scopes items to a named punch_list. Accepted
  // shape is the bare uuid since this is the URL the lists page links to.
  const listFilter = sp.list && /^[0-9a-f-]{36}$/.test(sp.list) ? sp.list : null;

  function fmtDate(d: string | null): string {
    if (!d) return "—";
    return fmt.dateParts(d + "T00:00:00", { month: "short", day: "numeric" });
  }

  // Hydrate the active list (if any) so we can show its name in the
  // breadcrumb + the "clear filter" affordance.
  const { data: activeList } = listFilter
    ? await supabase
        .from("punch_lists")
        .select("id, name, list_state")
        .eq("id", listFilter)
        .eq("org_id", session.orgId)
        .maybeSingle()
    : { data: null as { id: string; name: string; list_state: string } | null };

  let itemQuery = supabase
    .from("punch_items")
    .select(
      "id, code, title, item_state, priority, due_at, closed_at, show_ready_gate, project:project_id(name), assignee:assignee_id(name, email)",
    )
    .eq("org_id", session.orgId);
  if (listFilter) itemQuery = itemQuery.eq("punch_list_id", listFilter);
  const { data } = await itemQuery.order("created_at", { ascending: false }).limit(200);

  const rows = (data ?? []) as unknown as Row[];
  const open = rows.filter((r) => !["complete", "void"].includes(r.status)).length;
  const showReady = rows.filter((r) => r.show_ready_gate && !["complete", "void"].includes(r.status)).length;
  const urgent = rows.filter((r) => r.priority === "urgent" && !["complete", "void"].includes(r.status)).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.punch.eyebrow", undefined, "Operations")}
        title={
          activeList
            ? t("console.punch.titleFiltered", { name: activeList.name }, `Punch · ${activeList.name}`)
            : t("console.punch.title", undefined, "Punch List")
        }
        subtitle={
          activeList
            ? t("console.punch.subtitleFiltered", undefined, "Filtered to one list. Clear to see all items.")
            : t("console.punch.subtitle", undefined, "Show-ready checklist.")
        }
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/punch/lists" size="sm" variant="ghost">
              {t("console.punch.lists", undefined, "Lists")}
            </Button>
            {activeList && (
              <Button href="/console/punch" size="sm" variant="ghost">
                {t("console.punch.clearFilter", undefined, "Clear Filter")}
              </Button>
            )}
            <Button href="/console/punch/new" size="sm">
              {t("console.punch.newItem", undefined, "+ New Item")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label={t("console.punch.metric.open", undefined, "Open")} value={fmt.number(open)} accent />
          <MetricCard
            label={t("console.punch.metric.showReadyGates", undefined, "Show-ready gates")}
            value={fmt.number(showReady)}
          />
          <MetricCard label={t("console.punch.metric.urgent", undefined, "Urgent")} value={fmt.number(urgent)} />
        </div>
        <div className="flex items-center justify-end gap-1 text-xs">
          <a
            href="?view=list"
            className={`rounded border border-[var(--p-border)] px-2 py-1 ${view === "list" ? "bg-[var(--p-surface)] text-[var(--p-text-1)]" : "text-[var(--p-text-2)]"}`}
            aria-current={view === "list" ? "true" : undefined}
          >
            {t("console.punch.view.list", undefined, "List")}
          </a>
          <a
            href="?view=kanban"
            className={`rounded border border-[var(--p-border)] px-2 py-1 ${view === "kanban" ? "bg-[var(--p-surface)] text-[var(--p-text-1)]" : "text-[var(--p-text-2)]"}`}
            aria-current={view === "kanban" ? "true" : undefined}
          >
            {t("console.punch.view.kanban", undefined, "Kanban")}
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
            emptyLabel={t("console.punch.empty.label", undefined, "No punch items")}
            emptyDescription={t(
              "console.punch.empty.description",
              undefined,
              "Punch items capture show-ready gaps. Add one per gap; gate the doors-open milestone behind closure.",
            )}
            emptyAction={
              <Button href="/console/punch/new" size="sm">
                {t("console.punch.newItem", undefined, "+ New Item")}
              </Button>
            }
            columns={[
              {
                key: "code",
                header: t("console.punch.column.code", undefined, "Code"),
                render: (r) => r.code,
                className: "font-mono text-xs",
                accessor: (r) => r.code,
              },
              {
                key: "title",
                header: t("console.punch.column.title", undefined, "Title"),
                render: (r) => (
                  <div className="flex items-center gap-2">
                    {r.show_ready_gate && (
                      <span
                        title={t("console.punch.showReadyGate", undefined, "Show-ready gate")}
                        className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--p-danger)]"
                      />
                    )}
                    <span>{r.title}</span>
                  </div>
                ),
                accessor: (r) => r.show_ready_gate ?? null,
              },
              {
                key: "project",
                header: t("console.punch.column.project", undefined, "Project"),
                render: (r) => r.project?.name ?? "—",
                accessor: (r) => r.project?.name ?? null,
              },
              {
                key: "assignee",
                header: t("console.punch.column.assignee", undefined, "Assignee"),
                render: (r) => r.assignee?.name ?? r.assignee?.email ?? "—",
                filterable: true,
                groupable: true,
                accessor: (r) => r.assignee?.name ?? r.assignee?.email ?? null,
              },
              {
                key: "due",
                header: t("console.punch.column.due", undefined, "Due"),
                render: (r) => fmtDate(r.due_at),
                className: "font-mono text-xs",
                accessor: (r) => r.due_at ?? null,
              },
              {
                key: "priority",
                header: t("console.punch.column.priority", undefined, "Priority"),
                render: (r) => <Badge variant={PRIORITY_TONE[r.priority] ?? "default"}>{toTitle(r.priority)}</Badge>,
                accessor: (r) => r.priority ?? null,
                filterable: true,
                groupable: true,
              },
              {
                key: "status",
                header: t("console.punch.column.status", undefined, "Status"),
                render: (r) => (
                  <span className="inline-flex items-center gap-2">
                    <Badge variant={toneFor(r.status)}>{toTitle(r.status)}</Badge>
                    <DueDateBadge dueAt={r.due_at} closedAt={r.closed_at} status={r.status} iconOnly size="sm" />
                  </span>
                ),
                filterable: true,
                groupable: true,
                accessor: (r) => r.status ?? null,
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
