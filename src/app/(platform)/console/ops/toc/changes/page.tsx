import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type ChangeRow = {
  id: string;
  code: string;
  title: string;
  type: string;
  risk: string;
  impact: string;
  status: string;
  planned_start: string | null;
  planned_end: string | null;
  requested: { name: string | null; email: string | null } | null;
  assigned: { name: string | null; email: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  proposed: "muted",
  in_review: "info",
  approved: "info",
  rejected: "error",
  scheduled: "info",
  implementing: "warning",
  implemented: "success",
  closed: "muted",
  failed: "error",
};

const RISK_TONE: Record<string, "muted" | "warning" | "error"> = {
  low: "muted",
  medium: "warning",
  high: "error",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Operations" title="Changes" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const { data } = await supabase
    .from("itil_changes")
    .select(
      "id, code, title, type, risk, impact, status, planned_start, planned_end, requested:requested_by(name, email), assigned:assigned_to(name, email)",
    )
    .eq("org_id", session.orgId)
    .order("planned_start", { ascending: false, nullsFirst: false })
    .limit(500);

  const rows = (data ?? []) as unknown as ChangeRow[];
  const open = rows.filter((r) => !["closed", "rejected", "implemented", "failed"].includes(r.status)).length;
  const failed = rows.filter((r) => r.status === "failed").length;
  const emergency = rows.filter((r) => r.type === "emergency").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        title="Changes"
        subtitle={`${rows.length} change record${rows.length === 1 ? "" : "s"} · ${open} open${emergency ? ` · ${emergency} emergency` : ""}${failed ? ` · ${failed} failed` : ""}`}
        action={
          <Button href="/console/ops/toc/changes/new" size="sm">
            + New Change
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Open" value={fmtIntl.number(open)} accent />
          <MetricCard label="Emergency" value={fmtIntl.number(emergency)} />
          <MetricCard label="Failed" value={fmtIntl.number(failed)} />
        </div>

        <DataTable<ChangeRow>
          rows={rows}
          rowHref={(r) => `/console/ops/toc/changes/${r.id}`}
          emptyLabel="No change records"
          emptyDescription="ITIL change management — author records for non-trivial changes during live ops (rigging swap, generator hot-swap, software patch on the timing box). Each record carries risk, impact, planned window, and a backout plan."
          emptyAction={
            <Link href="/console/ops/toc/changes/new" className="btn btn-primary btn-sm">
              + New Change
            </Link>
          }
          columns={[
            {
              key: "code",
              header: "Code",
              render: (r) => <span className="font-mono text-xs">{r.code}</span>,
              accessor: (r) => r.code ?? null,
            },
            { key: "title", header: "Title", render: (r) => r.title, accessor: (r) => r.title },
            {
              key: "type",
              header: "Type",
              render: (r) => <Badge variant="muted">{r.type}</Badge>,
              accessor: (r) => r.type ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "risk",
              header: "Risk",
              render: (r) => <Badge variant={RISK_TONE[r.risk] ?? "muted"}>{r.risk}</Badge>,
              accessor: (r) => r.risk ?? null,
            },
            {
              key: "window",
              header: "Window",
              render: (r) => `${r.planned_start ? fmtIntl.dateTime(r.planned_start) : "—"} → ${r.planned_end ? fmtIntl.dateTime(r.planned_end) : "—"}`,
              className: "font-mono text-xs",
              accessor: (r) => r.planned_start ?? null,
            },
            {
              key: "owner",
              header: "Owner",
              render: (r) => r.assigned?.name ?? r.assigned?.email ?? "—",
              filterable: true,
              groupable: true,
              accessor: (r) => r.assigned?.name ?? r.assigned?.email ?? null,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status.replace(/_/g, " ")}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.status.replace ?? null,
            },
          ]}
        />

        <p className="text-xs text-[var(--text-muted)]">
          Operational telemetry (which rows changed, who edited what) lives in the audit log; the change register here
          is the human-curated ITIL record of intentional changes.
        </p>
      </div>
    </>
  );
}
