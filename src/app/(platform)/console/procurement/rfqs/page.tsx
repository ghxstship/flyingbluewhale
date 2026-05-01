import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type RfqRow = {
  id: string;
  title: string;
  description: string | null;
  estimated_cents: number | null;
  status: string;
  created_at: string;
  project: { name: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  draft: "muted",
  submitted: "info",
  approved: "success",
  rejected: "error",
  converted: "success",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Procurement" title="RFQs" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("requisitions")
    .select("id, title, description, estimated_cents, status, created_at, project:project_id(name)")
    .eq("org_id", session.orgId)
    .in("status", ["submitted", "approved"])
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as RfqRow[];
  const submitted = rows.filter((r) => r.status === "submitted").length;
  const approved = rows.filter((r) => r.status === "approved").length;
  const totalEstimate = rows.reduce((s, r) => s + (r.estimated_cents ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Procurement"
        title="RFQs"
        subtitle={`${rows.length} open · ${submitted} submitted · ${approved} approved`}
        action={
          <Button href="/console/procurement/requisitions/new" size="sm">
            + New requisition
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Open RFQs" value={rows.length.toLocaleString()} accent />
          <MetricCard label="Submitted" value={submitted.toLocaleString()} />
          <MetricCard label="Total estimate" value={formatMoney(totalEstimate)} />
        </div>

        <DataTable<RfqRow>
          rows={rows}
          rowHref={(r) => `/console/procurement/requisitions/${r.id}`}
          emptyLabel="No open RFQs"
          emptyDescription="RFQs are submitted/approved requisitions awaiting vendor quotes. Author one via Procurement → Requisitions."
          emptyAction={
            <Button href="/console/procurement/requisitions/new" size="sm">
              + New requisition
            </Button>
          }
          columns={[
            { key: "title", header: "Title", render: (r) => r.title },
            { key: "project", header: "Project", render: (r) => r.project?.name ?? "—" },
            {
              key: "estimate",
              header: "Estimate",
              render: (r) => formatMoney(r.estimated_cents ?? 0),
              className: "font-mono text-xs",
            },
            { key: "created", header: "Created", render: (r) => fmtDate(r.created_at), className: "font-mono text-xs" },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status}</Badge>,
            },
          ]}
        />
      </div>
    </>
  );
}
