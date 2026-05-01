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
  code: string;
  title: string;
  status: string;
  priority: string;
  due_at: string | null;
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

function fmt(d: string | null): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function Page() {
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
  const { data } = await supabase
    .from("punch_items")
    .select(
      "id, code, title, status, priority, due_at, show_ready_gate, project:project_id(name), assignee:assignee_id(name, email)",
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
        subtitle="Show-ready checklist. Pinnable to site plans, gates doors-open when items remain open."
        action={
          <Button href="/console/punch/new" size="sm">
            + New Item
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Open" value={open.toLocaleString()} accent />
          <MetricCard label="Show-ready gates" value={showReady.toLocaleString()} />
          <MetricCard label="Urgent" value={urgent.toLocaleString()} />
        </div>
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
            },
            { key: "project", header: "Project", render: (r) => r.project?.name ?? "—" },
            {
              key: "assignee",
              header: "Assignee",
              render: (r) => r.assignee?.name ?? r.assignee?.email ?? "—",
              filterable: true,
              groupable: true,
            },
            { key: "due", header: "Due", render: (r) => fmt(r.due_at), className: "font-mono text-xs" },
            {
              key: "priority",
              header: "Priority",
              render: (r) => <Badge variant={PRIORITY_TONE[r.priority] ?? "muted"}>{r.priority}</Badge>,
              accessor: (r) => r.priority ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status.replace("_", " ")}</Badge>,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
