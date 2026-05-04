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

type Row = {
  id: string;
  code: string;
  title: string;
  spec_section: string | null;
  status: string;
  current_round: number;
  due_at: string | null;
  project: { name: string | null } | null;
  vendor: { name: string | null } | null;
  ball: { name: string | null; email: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  draft: "muted",
  submitted: "info",
  in_review: "info",
  approved: "success",
  approved_with_comments: "success",
  revise_resubmit: "warning",
  rejected: "error",
  void: "muted",
  closed: "muted",
};

function fmt(d: string | null): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString();
}

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Procurement" title="Submittals" />
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
    .from("submittals")
    .select(
      "id, code, title, spec_section, status, current_round, due_at, project:project_id(name), vendor:vendor_id(name), ball:ball_in_court_id(name, email)",
    )
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];
  const inFlight = rows.filter((r) => ["submitted", "in_review", "revise_resubmit"].includes(r.status)).length;
  const approved = rows.filter((r) => ["approved", "approved_with_comments"].includes(r.status)).length;
  const rejected = rows.filter((r) => r.status === "rejected").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Procurement"
        title="Submittals"
        subtitle="Vendor packages with stamps + revision rounds. Spec-section organized."
        action={
          <Button href="/console/submittals/new" size="sm">
            + New Submittal
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="In Flight" value={fmtIntl.number(inFlight)} accent />
          <MetricCard label="Approved" value={fmtIntl.number(approved)} />
          <MetricCard label="Rejected" value={fmtIntl.number(rejected)} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/submittals/${r.id}`}
          emptyLabel="No submittals yet"
          emptyDescription="Vendor packages, technical specs, brand approvals — track them with stamps and revision rounds."
          emptyAction={
            <Button href="/console/submittals/new" size="sm">
              + New Submittal
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
            { key: "title", header: "Title", render: (r) => r.title, accessor: (r) => r.title },
            {
              key: "spec",
              header: "Spec",
              render: (r) => r.spec_section ?? "—",
              accessor: (r) => r.spec_section ?? null,
            },
            {
              key: "vendor",
              header: "Vendor",
              render: (r) => r.vendor?.name ?? "—",
              filterable: true,
              groupable: true,
              accessor: (r) => r.vendor?.name ?? null,
            },
            {
              key: "round",
              header: "Round",
              render: (r) => `#${r.current_round}`,
              className: "font-mono text-xs",
              accessor: (r) => r.current_round ?? null,
            },
            {
              key: "due",
              header: "Due",
              render: (r) => fmt(r.due_at),
              className: "font-mono text-xs",
              accessor: (r) => r.due_at ?? null,
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
      </div>
    </>
  );
}
