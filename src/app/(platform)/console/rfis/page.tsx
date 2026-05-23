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

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  code: string;
  subject: string;
  category: string | null;
  status: string;
  priority: string;
  due_at: string | null;
  closed_at: string | null;
  asked_at: string;
  project: { name: string | null } | null;
  ball_in_court: { name: string | null; email: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success"> = {
  open: "info",
  answered: "success",
  closed: "muted",
  void: "muted",
};
const PRIORITY_TONE: Record<string, "muted" | "info" | "warning" | "error"> = {
  low: "muted",
  normal: "info",
  high: "warning",
  urgent: "error",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Operations" title="RFIs" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  function fmtDate(d: string | null): string {
    if (!d) return "—";
    return fmt.dateParts(d, { month: "short", day: "numeric" });
  }
  const { data } = await supabase
    .from("rfis")
    .select(
      "id, code, subject, category, status, priority, due_at, closed_at, asked_at, project:project_id(name), ball_in_court:ball_in_court_id(name, email)",
    )
    .eq("org_id", session.orgId)
    .order("asked_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];
  const open = rows.filter((r) => r.status === "open").length;
  const overdue = rows.filter((r) => r.status === "open" && r.due_at && new Date(r.due_at) < new Date()).length;
  const answered = rows.filter((r) => r.status === "answered").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        title="RFIs"
        subtitle="Production queries — official questions with ball-in-court routing and binding answers."
        action={
          <Button href="/console/rfis/new" size="sm">
            + New RFI
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Open" value={fmt.number(open)} accent />
          <MetricCard label="Overdue" value={fmt.number(overdue)} />
          <MetricCard label="Answered" value={fmt.number(answered)} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/rfis/${r.id}`}
          emptyLabel="No RFIs yet"
          emptyDescription="Vendors and talent need binding answers on rigging weights, power, brand approvals, etc. Track them here."
          emptyAction={
            <Button href="/console/rfis/new" size="sm">
              + New RFI
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
            { key: "subject", header: "Subject", render: (r) => r.subject, accessor: (r) => r.subject },
            {
              key: "project",
              header: "Project",
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
            },
            {
              key: "ball",
              header: "Ball in Court",
              render: (r) => r.ball_in_court?.name ?? r.ball_in_court?.email ?? "—",
              accessor: (r) => r.ball_in_court?.name ?? r.ball_in_court?.email ?? null,
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
              render: (r) => <Badge variant={PRIORITY_TONE[r.priority] ?? "muted"}>{r.priority}</Badge>,
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
