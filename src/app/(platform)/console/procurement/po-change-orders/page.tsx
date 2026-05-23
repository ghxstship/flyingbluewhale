import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  number: number;
  title: string;
  status: string;
  amount_cents: number;
  schedule_impact_days: number;
  proposed_at: string;
  purchase_order: { number: string } | null;
  project: { name: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "error"> = {
  proposed: "muted",
  submitted: "info",
  in_review: "info",
  approved: "success",
  rejected: "error",
  void: "muted",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Procurement" title="PO Change Orders" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("po_change_orders")
    .select(
      "id, number, title, status, amount_cents, schedule_impact_days, proposed_at, purchase_order:purchase_order_id(number), project:project_id(name)",
    )
    .eq("org_id", session.orgId)
    .order("proposed_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];
  const pending = rows.filter((r) => ["proposed", "submitted", "in_review"].includes(r.status));
  const totalApproved = rows.filter((r) => r.status === "approved").reduce((s, r) => s + r.amount_cents, 0);
  const totalPending = pending.reduce((s, r) => s + r.amount_cents, 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Procurement"
        title="PO Change Orders"
        subtitle="Vendor change orders against existing POs."
        action={
          <Button href="/console/procurement/po-change-orders/new" size="sm">
            + New Change Order
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Pending" value={fmt.number(pending.length)} accent />
          <MetricCard label="Pending Value" value={formatMoney(totalPending)} />
          <MetricCard label="Approved Value" value={formatMoney(totalApproved)} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/procurement/po-change-orders/${r.id}`}
          emptyLabel="No change orders"
          emptyDescription="When scope or quantity changes mid-job, log the impact here. Tracks cost and schedule deltas per PO."
          emptyAction={
            <Button href="/console/procurement/po-change-orders/new" size="sm">
              + New Change Order
            </Button>
          }
          columns={[
            {
              key: "po",
              header: "PO",
              render: (r) => r.purchase_order?.number ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.purchase_order?.number ?? null,
            },
            {
              key: "num",
              header: "CO #",
              render: (r) => `#${r.number}`,
              className: "font-mono text-xs",
              accessor: (r) => r.number ?? null,
            },
            { key: "title", header: "Title", render: (r) => r.title, accessor: (r) => r.title },
            {
              key: "amount",
              header: "Amount",
              render: (r) => formatMoney(r.amount_cents),
              className: "font-mono text-xs",
              accessor: (r) => Number(r.amount_cents ?? 0),
            },
            {
              key: "days",
              header: "Schedule Δ (days)",
              render: (r) => r.schedule_impact_days.toString(),
              className: "font-mono text-xs",
              accessor: (r) => r.schedule_impact_days.toString ?? null,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status.replace("_", " ")}</Badge>,
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
