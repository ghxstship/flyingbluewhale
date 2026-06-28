import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { formatMoney } from "@/lib/commerce_store";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { Database } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

type ListingRef = { title: string | null } | null;

type PayoutRow = Pick<
  Database["public"]["Tables"]["event_payouts"]["Row"],
  "id" | "period_label" | "net_cents" | "currency" | "payout_state" | "scheduled_for" | "paid_at"
> & {
  event_listings: ListingRef;
};

type RevenueRow = Pick<
  Database["public"]["Views"]["v_event_revenue"]["Row"],
  "gross_cents" | "fees_cents" | "refunds_cents" | "paid_out_cents"
>;

/**
 * /studio/revenue/payouts — first-party box-office settlement ledger
 * (IMPLEMENTATION §5). Reads event_payouts org-scoped, with the listing title
 * joined for context. The Gross / Fees / Refunds / Paid out summary is read
 * straight from v_event_revenue (the SSOT) and never recomputed here.
 */
export default async function RevenuePayoutsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Commerce" title={t("console.revenue.payouts.title", undefined, "Payouts")} />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: payoutData }, { data: revenueData }] = await Promise.all([
    supabase
      .from("event_payouts")
      .select("id, period_label, net_cents, currency, payout_state, scheduled_for, paid_at, event_listings(title)")
      .eq("org_id", session.orgId)
      .order("scheduled_for", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("v_event_revenue")
      .select("gross_cents, fees_cents, refunds_cents, paid_out_cents")
      .eq("org_id", session.orgId),
  ]);

  const rows = (payoutData ?? []) as PayoutRow[];
  const revenue = (revenueData ?? []) as RevenueRow[];

  // Derived totals across the org's first-party events — read from
  // v_event_revenue (SSOT), summed, never recomputed from raw orders.
  const totals = revenue.reduce(
    (acc, r) => ({
      gross: acc.gross + (r.gross_cents ?? 0),
      fees: acc.fees + (r.fees_cents ?? 0),
      refunds: acc.refunds + (r.refunds_cents ?? 0),
      paidOut: acc.paidOut + (r.paid_out_cents ?? 0),
    }),
    { gross: 0, fees: 0, refunds: 0, paidOut: 0 },
  );

  const summary: { labelKey: string; fallback: string; value: number }[] = [
    { labelKey: "console.revenue.payouts.summary.gross", fallback: "Gross", value: totals.gross },
    { labelKey: "console.revenue.payouts.summary.fees", fallback: "Fees", value: totals.fees },
    { labelKey: "console.revenue.payouts.summary.refunds", fallback: "Refunds", value: totals.refunds },
    { labelKey: "console.revenue.payouts.summary.paidOut", fallback: "Paid out", value: totals.paidOut },
  ];

  function whenLabel(r: PayoutRow): string {
    if (r.paid_at) return timeAgo(r.paid_at);
    if (r.scheduled_for) return timeAgo(r.scheduled_for);
    return "—";
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.revenue.eyebrow", undefined, "Commerce")}
        title={t("console.revenue.payouts.title", undefined, "Payouts")}
        subtitle={rows.length === 1 ? "1 payout" : `${rows.length} payouts`}
        breadcrumbs={[{ label: "Commerce" }, { label: "Revenue" }, { label: "Payouts" }]}
      />
      <div className="page-content">
        <div className="metric-grid mb-6">
          {summary.map((s) => (
            <MetricCard key={s.labelKey} label={t(s.labelKey, undefined, s.fallback)} value={formatMoney(s.value)} />
          ))}
        </div>
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.revenue.payouts.emptyTitle", undefined, "No payouts yet")}
            description={t(
              "console.revenue.payouts.emptyDescription",
              undefined,
              "Box-office settlement payouts for your first-party events appear here once a payout is scheduled.",
            )}
          />
        ) : (
          <DataTable<PayoutRow>
            rows={rows}
            columns={[
              {
                key: "period",
                header: t("console.revenue.payouts.col.period", undefined, "Period"),
                render: (r) => r.period_label ?? "—",
                accessor: (r) => r.period_label ?? "",
              },
              {
                key: "event",
                header: t("console.revenue.payouts.col.event", undefined, "Event"),
                render: (r) => r.event_listings?.title ?? "—",
                accessor: (r) => r.event_listings?.title ?? "",
              },
              {
                key: "net",
                header: t("console.revenue.payouts.col.net", undefined, "Net"),
                render: (r) => formatMoney(r.net_cents, r.currency),
                accessor: (r) => r.net_cents,
                className: "tabular-nums",
              },
              {
                key: "state",
                header: t("console.revenue.payouts.col.state", undefined, "State"),
                render: (r) => <StatusBadge status={r.payout_state} />,
                accessor: (r) => r.payout_state,
                filterable: true,
              },
              {
                key: "when",
                header: t("console.revenue.payouts.col.when", undefined, "When"),
                render: (r) => whenLabel(r),
                accessor: (r) => r.paid_at ?? r.scheduled_for ?? "",
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
