import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type ProblemRow = {
  id: string;
  code: string;
  title: string;
  priority: string;
  status: string;
  detected_at: string;
  resolved_at: string | null;
  reporter: { name: string | null; email: string | null } | null;
  assigned: { name: string | null; email: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  new: "warning",
  investigating: "info",
  known_error: "warning",
  resolved: "success",
  closed: "muted",
};

const PRIORITY_TONE: Record<string, "muted" | "info" | "warning" | "error"> = {
  P1: "error",
  P2: "warning",
  P3: "info",
  P4: "muted",
};

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
        <ModuleHeader eyebrow="Operations" title="Problems" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("itil_problems")
    .select(
      "id, code, title, priority, status, detected_at, resolved_at, reporter:reporter_id(name, email), assigned:assigned_to(name, email)",
    )
    .eq("org_id", session.orgId)
    .order("detected_at", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as unknown as ProblemRow[];
  const open = rows.filter((r) => !["resolved", "closed"].includes(r.status)).length;
  const knownErrors = rows.filter((r) => r.status === "known_error").length;
  const p1 = rows.filter((r) => r.priority === "P1").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        title="Problems"
        subtitle={`${rows.length} problem record${rows.length === 1 ? "" : "s"} · ${open} open · ${knownErrors} known errors${p1 ? ` · ${p1} P1` : ""}`}
        action={
          <Button href="/console/ops/toc/problems/new" size="sm">
            + New Problem
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Open" value={open.toLocaleString()} accent />
          <MetricCard label="Known Errors" value={knownErrors.toLocaleString()} />
          <MetricCard label="P1" value={p1.toLocaleString()} />
        </div>

        <DataTable<ProblemRow>
          rows={rows}
          rowHref={(r) => `/console/ops/toc/problems/${r.id}`}
          emptyLabel="No problems registered"
          emptyDescription="ITIL problem management — record root-cause investigations triggered by incidents. Link incidents and the change(s) that resolve them."
          emptyAction={
            <Link href="/console/ops/toc/problems/new" className="btn btn-primary btn-sm">
              + New Problem
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
              key: "priority",
              header: "Priority",
              render: (r) => <Badge variant={PRIORITY_TONE[r.priority] ?? "muted"}>{r.priority}</Badge>,
              accessor: (r) => r.priority ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "detected",
              header: "Detected",
              render: (r) => fmt(r.detected_at),
              className: "font-mono text-xs",
              accessor: (r) => r.detected_at ?? null,
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
          Problem records are the SSOT for known errors and root-cause investigations. Link incidents (cause) and
          changes (fix) to close the loop.
        </p>
      </div>
    </>
  );
}
