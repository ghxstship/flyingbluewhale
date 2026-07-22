import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  number: number;
  title: string;
  change_order_state: string;
  amount_cents: number;
  schedule_impact_days: number;
  proposed_at: string;
  purchase_order: { number: string } | null;
  project: { name: string | null } | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.procurement.poChangeOrders.eyebrow", undefined, "Procurement")}
          title={t("console.procurement.poChangeOrders.title", undefined, "PO Change Orders")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.procurement.poChangeOrders.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
      "id, number, title, change_order_state, amount_cents, schedule_impact_days, proposed_at, purchase_order:purchase_order_id(number), project:project_id(name)",
    )
    .eq("org_id", session.orgId)
    .order("proposed_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];
  const pending = rows.filter((r) => ["proposed", "submitted", "in_review"].includes(r.change_order_state));
  const totalApproved = rows
    .filter((r) => r.change_order_state === "approved")
    .reduce((s, r) => s + r.amount_cents, 0);
  const totalPending = pending.reduce((s, r) => s + r.amount_cents, 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.poChangeOrders.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.poChangeOrders.title", undefined, "PO Change Orders")}
        subtitle={t(
          "console.procurement.poChangeOrders.subtitle",
          undefined,
          "Vendor change orders against existing POs.",
        )}
        action={
          <Button href="/studio/procurement/po-change-orders/new" size="sm">
            {t("console.procurement.poChangeOrders.newAction", undefined, "+ New Change Order")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.procurement.poChangeOrders.metric.pending", undefined, "Pending")}
            value={fmt.number(pending.length)}
            accent
          />
          <MetricCard
            label={t("console.procurement.poChangeOrders.metric.pendingValue", undefined, "Pending Value")}
            value={formatMoney(totalPending)}
          />
          <MetricCard
            label={t("console.procurement.poChangeOrders.metric.approvedValue", undefined, "Approved Value")}
            value={formatMoney(totalApproved)}
          />
        </div>
        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/procurement/po-change-orders/${r.id}`}
          emptyLabel={t("console.procurement.poChangeOrders.emptyLabel", undefined, "No change orders")}
          emptyDescription={t(
            "console.procurement.poChangeOrders.emptyDescription",
            undefined,
            "When scope or quantity changes mid-job, log the impact here. Tracks cost and schedule deltas per PO.",
          )}
          emptyAction={
            <Button href="/studio/procurement/po-change-orders/new" size="sm">
              {t("console.procurement.poChangeOrders.newAction", undefined, "+ New Change Order")}
            </Button>
          }
          columns={[
            {
              key: "po",
              header: t("console.procurement.poChangeOrders.col.po", undefined, "PO"),
              render: (r) => r.purchase_order?.number ?? "—",
              mono: true,
              accessor: (r) => r.purchase_order?.number ?? null,
            },
            {
              key: "num",
              header: t("console.procurement.poChangeOrders.col.coNumber", undefined, "CO #"),
              render: (r) => `#${r.number}`,
              mono: true,
              accessor: (r) => r.number ?? null,
            },
            {
              key: "title",
              header: t("console.procurement.poChangeOrders.col.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "amount",
              header: t("console.procurement.poChangeOrders.col.amount", undefined, "Amount"),
              render: (r) => formatMoney(r.amount_cents),
              mono: true,
              accessor: (r) => Number(r.amount_cents ?? 0),
            },
            {
              key: "days",
              header: t("console.procurement.poChangeOrders.col.scheduleDelta", undefined, "Schedule Δ (Days)"),
              render: (r) => r.schedule_impact_days.toString(),
              mono: true,
              accessor: (r) => r.schedule_impact_days.toString ?? null,
            },
            {
              key: "status",
              header: t("console.procurement.poChangeOrders.col.status", undefined, "Status"),
              render: (r) => <Badge variant={toneFor(r.change_order_state)}>{toTitle(r.change_order_state)}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.change_order_state ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
