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
  application_number: number;
  period_start: string;
  period_end: string;
  status: string;
  total_completed_cents: number;
  total_due_cents: number;
  retention_pct: number;
  vendor: { name: string | null } | null;
  purchase_order: { number: string; title: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  draft: "muted",
  submitted: "info",
  in_review: "info",
  approved: "success",
  rejected: "error",
  paid: "success",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Finance" title="Pay Apps" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtDate = (d: string): string => fmt.dateParts(d + "T00:00:00", { month: "short", day: "numeric" });
  const { data } = await supabase
    .from("payment_applications")
    .select(
      "id, application_number, period_start, period_end, status, total_completed_cents, total_due_cents, retention_pct, vendor:vendor_id(name), purchase_order:purchase_order_id(number, title)",
    )
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];
  const inFlight = rows.filter((r) => ["submitted", "in_review"].includes(r.status));
  const totalDue = inFlight.reduce((s, r) => s + (r.total_due_cents ?? 0), 0);
  const totalCompleted = rows.reduce((s, r) => s + (r.total_completed_cents ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Finance"
        title="Pay Applications"
        subtitle="Production progress billing against PO line items."
        action={
          <Button href="/console/finance/pay-apps/new" size="sm">
            + New Pay App
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Pending Review" value={fmt.number(inFlight.length)} accent />
          <MetricCard label="Net Due" value={formatMoney(totalDue)} />
          <MetricCard label="Completed YTD" value={formatMoney(totalCompleted)} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/finance/pay-apps/${r.id}`}
          emptyLabel="No pay apps yet"
          emptyDescription="Vendors bill by % completion against PO line items. Retention is held back automatically."
          emptyAction={
            <Button href="/console/finance/pay-apps/new" size="sm">
              + New Pay App
            </Button>
          }
          columns={[
            {
              key: "num",
              header: "Application",
              render: (r) => `#${r.application_number}`,
              className: "font-mono text-xs",
              accessor: (r) => r.application_number ?? null,
            },
            {
              key: "po",
              header: "PO",
              render: (r) => r.purchase_order?.number ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.purchase_order?.number ?? null,
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
              key: "period",
              header: "Period",
              render: (r) => `${fmtDate(r.period_start)} — ${fmtDate(r.period_end)}`,
              className: "font-mono text-xs",
              accessor: (r) => r.period_start ?? null,
            },
            {
              key: "completed",
              header: "Completed",
              render: (r) => formatMoney(r.total_completed_cents ?? 0),
              className: "font-mono text-xs",
              accessor: (r) => Number(r.total_completed_cents ?? 0),
            },
            {
              key: "due",
              header: "Due",
              render: (r) => formatMoney(r.total_due_cents ?? 0),
              className: "font-mono text-xs",
              accessor: (r) => Number(r.total_due_cents ?? 0),
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
