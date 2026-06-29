import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { WORK_ORDER_STATE_LABELS, formatCents, type WorkOrderState } from "@/lib/subcontractor";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  trade: string;
  visibility: string;
  work_order_state: WorkOrderState;
  budget_guide_cents: number | null;
};

export default async function MarketplacePage() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data } = await supabase
    .from("work_orders")
    .select("id, title, trade, visibility, work_order_state, budget_guide_cents")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as Row[];
  const published = rows.filter((r) => r.visibility === "public" && ["posted", "bids-in"].includes(r.work_order_state));
  const draftPrivate = rows.filter((r) => r.visibility === "private").length;

  const columns: Column<Row>[] = [
    { key: "title", header: t("console.procurement.marketplace.col.title", undefined, "Work order"), render: (r) => r.title },
    { key: "trade", header: t("console.procurement.marketplace.col.trade", undefined, "Trade"), render: (r) => r.trade },
    {
      key: "visibility",
      header: t("console.procurement.marketplace.col.visibility", undefined, "Visibility"),
      render: (r) => (
        <Badge variant={r.visibility === "public" ? "success" : "muted"}>{r.visibility === "public" ? "Public" : "Private"}</Badge>
      ),
    },
    {
      key: "state",
      header: t("console.procurement.marketplace.col.state", undefined, "State"),
      render: (r) => <span className="text-[var(--p-text-2)]">{WORK_ORDER_STATE_LABELS[r.work_order_state]}</span>,
    },
    {
      key: "budget",
      header: t("console.procurement.marketplace.col.budget", undefined, "Budget"),
      render: (r) => <span className="font-mono">{formatCents(r.budget_guide_cents)}</span>,
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.marketplace.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.marketplace.title", undefined, "Trades Marketplace")}
        subtitle={t(
          "console.procurement.marketplace.subtitle",
          undefined,
          "Publish a work order to the public board to source bids from outside trade crews.",
        )}
      />
      <div className="mb-6 flex justify-end">
        <Button href="/studio/production/work-orders/new">
          {t("console.procurement.marketplace.post", undefined, "Post a Work Order")}
        </Button>
      </div>
      <div className="metric-grid mb-6">
        <MetricCard label={t("console.procurement.marketplace.published", undefined, "Published")} value={String(published.length)} />
        <MetricCard label={t("console.procurement.marketplace.private", undefined, "Private")} value={String(draftPrivate)} />
        <MetricCard label={t("console.procurement.marketplace.total", undefined, "Total")} value={String(rows.length)} />
      </div>
      <DataTable
        rows={rows}
        columns={columns}
        rowHref={(r) => `/studio/production/work-orders/${r.id}`}
        emptyLabel={t("console.procurement.marketplace.empty", undefined, "No work orders to publish yet")}
      />
    </>
  );
}
