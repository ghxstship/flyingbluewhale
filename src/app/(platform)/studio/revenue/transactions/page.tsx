import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
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

type TxnRow = {
  id: string;
  txn_kind: string;
  amount_cents: number;
  currency: string;
  txn_state: string;
  processor: string;
  processor_ref: string | null;
  occurred_at: string;
};

const KIND_VARIANT: Record<string, "success" | "error" | "info" | "muted"> = {
  charge: "success",
  refund: "error",
  payout: "info",
  fee: "muted",
  adjustment: "muted",
};

/**
 * /studio/revenue/transactions — the Revenue money-movement ledger (charges,
 * refunds, payouts, fees) across marketplace + box office + store. Reads
 * revenue_transactions (migration 20260623150000).
 */
export default async function RevenueTransactionsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Sales" title={t("console.revenue.transactions.title", undefined, "Transactions")} />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase
    .from("revenue_transactions")
    .select("id, txn_kind, amount_cents, currency, txn_state, processor, processor_ref, occurred_at")
    .eq("org_id", session.orgId)
    .order("occurred_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as TxnRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.revenue.eyebrow", undefined, "Sales")}
        title={t("console.revenue.transactions.title", undefined, "Transactions")}
        subtitle={rows.length === 1 ? "1 transaction" : `${rows.length} transactions`}
        breadcrumbs={[{ label: "Sales" }, { label: "Revenue" }, { label: "Transactions" }]}
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.revenue.transactions.emptyTitle", undefined, "No transactions yet")}
            description={t(
              "console.revenue.transactions.emptyDescription",
              undefined,
              "Charges, refunds, payouts, and fees recorded by the payment processor appear here.",
            )}
          />
        ) : (
          <DataTable<TxnRow>
            rows={rows}
            columns={[
              {
                key: "kind",
                header: t("console.revenue.transactions.col.kind", undefined, "Kind"),
                render: (r) => <Badge variant={KIND_VARIANT[r.txn_kind] ?? "muted"}>{toTitle(r.txn_kind)}</Badge>,
                accessor: (r) => r.txn_kind,
                filterable: true,
                groupable: true,
              },
              {
                key: "amount",
                header: t("console.revenue.transactions.col.amount", undefined, "Amount"),
                render: (r) => formatMoney(r.amount_cents, r.currency),
                accessor: (r) => r.amount_cents,
                className: "tabular-nums",
              },
              {
                key: "processor",
                header: t("console.revenue.transactions.col.processor", undefined, "Processor"),
                render: (r) =>
                  r.processor_ref ? `${toTitle(r.processor)} · ${r.processor_ref}` : toTitle(r.processor),
                accessor: (r) => r.processor,
              },
              {
                key: "state",
                header: t("console.revenue.transactions.col.state", undefined, "State"),
                render: (r) => <StatusBadge status={r.txn_state} />,
                accessor: (r) => r.txn_state,
                filterable: true,
              },
              {
                key: "occurred",
                header: t("console.revenue.transactions.col.occurred", undefined, "When"),
                render: (r) => timeAgo(r.occurred_at),
                accessor: (r) => r.occurred_at,
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
