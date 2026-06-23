import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo, toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { formatMoney } from "@/lib/commerce_store";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  order_source: string;
  reference: string;
  buyer_email: string | null;
  total_cents: number;
  currency: string;
  order_state: string;
  placed_at: string;
};

/**
 * /studio/revenue/orders — the transactional Revenue order book (marketplace +
 * box office + store), distinct from Finance AR. Reads revenue_orders
 * (migration 20260623150000) — apply it, then regenerate the typed client.
 */
export default async function RevenueOrdersPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Commerce" title={t("console.revenue.orders.title", undefined, "Orders")} />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase
    .from("revenue_orders")
    .select("id, order_source, reference, buyer_email, total_cents, currency, order_state, placed_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("placed_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as OrderRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.revenue.eyebrow", undefined, "Commerce")}
        title={t("console.revenue.orders.title", undefined, "Orders")}
        subtitle={rows.length === 1 ? "1 order" : `${rows.length} orders`}
        breadcrumbs={[{ label: "Commerce" }, { label: "Revenue" }, { label: "Orders" }]}
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.revenue.orders.emptyTitle", undefined, "No orders yet")}
            description={t(
              "console.revenue.orders.emptyDescription",
              undefined,
              "Marketplace, box-office, and store orders land here once buyers check out.",
            )}
          />
        ) : (
          <DataTable<OrderRow>
            rows={rows}
            columns={[
              {
                key: "reference",
                header: t("console.revenue.orders.col.reference", undefined, "Reference"),
                render: (r) => r.reference,
                accessor: (r) => r.reference,
              },
              {
                key: "source",
                header: t("console.revenue.orders.col.source", undefined, "Source"),
                render: (r) => toTitle(r.order_source),
                accessor: (r) => r.order_source,
                filterable: true,
                groupable: true,
              },
              {
                key: "buyer",
                header: t("console.revenue.orders.col.buyer", undefined, "Buyer"),
                render: (r) => r.buyer_email ?? "—",
                accessor: (r) => r.buyer_email ?? "",
              },
              {
                key: "total",
                header: t("console.revenue.orders.col.total", undefined, "Total"),
                render: (r) => formatMoney(r.total_cents, r.currency),
                accessor: (r) => r.total_cents,
                className: "tabular-nums",
              },
              {
                key: "state",
                header: t("console.revenue.orders.col.state", undefined, "State"),
                render: (r) => <StatusBadge status={r.order_state} />,
                accessor: (r) => r.order_state,
                filterable: true,
              },
              {
                key: "placed",
                header: t("console.revenue.orders.col.placed", undefined, "Placed"),
                render: (r) => timeAgo(r.placed_at),
                accessor: (r) => r.placed_at,
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
