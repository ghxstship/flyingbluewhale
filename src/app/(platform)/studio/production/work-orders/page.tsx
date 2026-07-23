import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView, type DataViewColumn } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import {
  DISPATCH_MODE_LABELS,
  WORK_ORDER_STATE_LABELS,
  formatCents,
  type DispatchMode,
  type WorkOrderState,
} from "@/lib/subcontractor";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  trade: string;
  work_order_state: WorkOrderState;
  dispatch_mode: DispatchMode;
  budget_guide_cents: number | null;
  start_date: string | null;
};

const STATE_TONE: Record<WorkOrderState, "muted" | "info" | "success" | "warning" | "error"> = {
  draft: "muted",
  posted: "info",
  "bids-in": "info",
  awarded: "success",
  "in-progress": "info",
  complete: "success",
  approved: "success",
  invoiced: "warning",
  closed: "muted",
  cancelled: "error",
};

export default async function WorkOrdersPage() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data } = await supabase
    .from("work_orders")
    .select("id, title, trade, work_order_state, dispatch_mode, budget_guide_cents, start_date")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as Row[];
  const open = rows.filter((r) => ["posted", "bids-in"].includes(r.work_order_state)).length;
  const active = rows.filter((r) => ["awarded", "in-progress"].includes(r.work_order_state)).length;
  const closed = rows.filter((r) => ["closed", "invoiced", "approved"].includes(r.work_order_state)).length;

  const columns: DataViewColumn<Row>[] = [
    { key: "title", header: t("console.production.workOrders.col.title", undefined, "Title"), render: (r) => r.title },
    { key: "trade", header: t("console.production.workOrders.col.trade", undefined, "Trade"), render: (r) => r.trade },
    {
      key: "state",
      header: t("console.production.workOrders.col.state", undefined, "Status"),
      render: (r) => <Badge variant={STATE_TONE[r.work_order_state]}>{WORK_ORDER_STATE_LABELS[r.work_order_state]}</Badge>,
    },
    {
      key: "mode",
      header: t("console.production.workOrders.col.mode", undefined, "Dispatch"),
      render: (r) => <span className="text-[var(--p-text-2)]">{DISPATCH_MODE_LABELS[r.dispatch_mode]}</span>,
    },
    {
      key: "budget",
      header: t("console.production.workOrders.col.budget", undefined, "Budget"),
      render: (r) => formatCents(r.budget_guide_cents),
      tabular: true,
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.workOrders.eyebrow", undefined, "Production")}
        title={t("console.production.workOrders.title", undefined, "Work Orders")}
        subtitle={t(
          "console.production.workOrders.subtitle",
          undefined,
          "Dispatch outside trade crews, take bids from eligible subs, and run the job to close-out.",
        )}
      />

      <div className="mb-6 flex justify-end">
        <Button href="/studio/production/work-orders/new">
          {t("console.production.workOrders.new", undefined, "New Work Order")}
        </Button>
      </div>

      <div className="metric-grid mb-6">
        <MetricCard label={t("console.production.workOrders.open", undefined, "Open for bids")} value={String(open)} />
        <MetricCard label={t("console.production.workOrders.active", undefined, "Active")} value={String(active)} />
        <MetricCard label={t("console.production.workOrders.closed", undefined, "Closed")} value={String(closed)} />
      </div>

      <DataView
        rows={rows}
        columns={columns}
        rowHref={(r) => `/studio/production/work-orders/${r.id}`}
        emptyLabel={t("console.production.workOrders.empty", undefined, "No work orders yet")}
        emptyDescription={t(
          "console.production.workOrders.emptyBody",
          undefined,
          "Create a work order to dispatch a trade crew.",
        )}
      />
    </>
  );
}
