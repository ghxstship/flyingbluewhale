import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type InvoiceRow = {
  id: string;
  number: string;
  amount_cents: number;
  currency: string;
  invoice_state: string;
  due_at: string | null;
};

type ExpenseRow = {
  id: string;
  amount_cents: number;
  currency: string;
  expense_state: string;
};

type StripeEventRow = {
  event_id: string;
  type: string;
  received_at: string;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.finance.eyebrow", undefined, "Finance")}
          title={t("console.finance.treasury.title", undefined, "Treasury")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.treasury.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtDate = (iso: string | null): string => {
    if (!iso) return "—";
    return fmt.dateParts(iso, { month: "short", day: "numeric", year: "numeric" });
  };
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: invData }, { data: expData }, { data: stripeData }] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, number, amount_cents, currency, invoice_state, due_at")
      .eq("org_id", session.orgId)
      .order("issued_at", { ascending: false })
      .limit(500),
    supabase
      .from("expenses")
      .select("id, amount_cents, currency, expense_state")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("stripe_events")
      .select("event_id, type, received_at")
      .gte("received_at", since30)
      .order("received_at", { ascending: false })
      .limit(50),
  ]);

  const invoices = (invData ?? []) as InvoiceRow[];
  const expenses = (expData ?? []) as ExpenseRow[];
  const stripeEvents = (stripeData ?? []) as StripeEventRow[];

  // Group by currency
  const byCurrency = invoices.reduce<Map<string, { paid: number; outstanding: number }>>((map, inv) => {
    const cur = map.get(inv.currency) ?? { paid: 0, outstanding: 0 };
    if (inv.invoice_state === "paid") cur.paid += inv.amount_cents;
    else if (["sent", "overdue", "draft"].includes(inv.invoice_state)) cur.outstanding += inv.amount_cents;
    map.set(inv.currency, cur);
    return map;
  }, new Map());

  const expByCurrency = expenses.reduce<Map<string, number>>((map, ex) => {
    if (["pending", "approved"].includes(ex.expense_state)) {
      map.set(ex.currency, (map.get(ex.currency) ?? 0) + ex.amount_cents);
    }
    return map;
  }, new Map());

  const overdue = invoices.filter(
    (i) => i.due_at && new Date(i.due_at).getTime() < Date.now() && i.invoice_state !== "paid",
  );
  const overdueTotal = overdue.reduce((s, i) => s + i.amount_cents, 0);

  const HUB_TILES: Array<{ href: string; label: string; description: string }> = [
    {
      href: "/studio/finance/invoices",
      label: t("console.finance.treasury.tiles.invoices.label", undefined, "Invoices"),
      description: t(
        "console.finance.treasury.tiles.invoices.description",
        undefined,
        "Receivables (issued, sent, paid)",
      ),
    },
    {
      href: "/studio/finance/expenses",
      label: t("console.finance.treasury.tiles.expenses.label", undefined, "Expenses"),
      description: t(
        "console.finance.treasury.tiles.expenses.description",
        undefined,
        "Payables awaiting reimbursement",
      ),
    },
    {
      href: "/studio/finance/budgets",
      label: t("console.finance.treasury.tiles.budgets.label", undefined, "Budgets"),
      description: t("console.finance.treasury.tiles.budgets.description", undefined, "Project P&L envelopes"),
    },
    {
      href: "/studio/finance/payouts",
      label: t("console.finance.treasury.tiles.payouts.label", undefined, "Payouts"),
      description: t(
        "console.finance.treasury.tiles.payouts.description",
        undefined,
        "Stripe Connect supplier payments",
      ),
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.eyebrow", undefined, "Finance")}
        title={t("console.finance.treasury.title", undefined, "Treasury")}
        subtitle={t("console.finance.treasury.subtitle", undefined, "Cash position, receivables, payables.")}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.finance.treasury.metrics.outstandingReceivables", undefined, "Outstanding Receivables")}
            value={fmt.number(Array.from(byCurrency.values()).reduce((s, v) => s + v.outstanding, 0))}
            accent
          />
          <MetricCard
            label={t("console.finance.treasury.metrics.pendingPayables", undefined, "Pending Payables")}
            value={fmt.number(Array.from(expByCurrency.values()).reduce((s, v) => s + v, 0))}
          />
          <MetricCard
            label={t("console.finance.treasury.metrics.stripeEvents30d", undefined, "Stripe Events · 30d")}
            value={fmt.number(stripeEvents.length)}
          />
        </div>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">
            {t("console.finance.treasury.byCurrency", undefined, "By Currency")}
          </h3>
          {byCurrency.size === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t("console.finance.treasury.noInvoices", undefined, "No invoices issued yet.")}
            </p>
          ) : (
            <table className="ps-table mt-3 w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.finance.treasury.columns.currency", undefined, "Currency")}</th>
                  <th className="text-end">{t("console.finance.treasury.columns.paid", undefined, "Paid")}</th>
                  <th className="text-end">
                    {t("console.finance.treasury.columns.outstanding", undefined, "Outstanding")}
                  </th>
                  <th className="text-end">
                    {t("console.finance.treasury.columns.pendingPayables", undefined, "Pending payables")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from(byCurrency.entries()).map(([currency, agg]) => (
                  <tr key={currency}>
                    <td>
                      <Badge variant="muted">{currency}</Badge>
                    </td>
                    <td className="text-end font-mono text-xs">{formatMoney(agg.paid, currency)}</td>
                    <td className="text-end font-mono text-xs">{formatMoney(agg.outstanding, currency)}</td>
                    <td className="text-end font-mono text-xs">
                      {formatMoney(expByCurrency.get(currency) ?? 0, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {overdue.length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">
              {t(
                "console.finance.treasury.overdueHeading",
                { count: overdue.length, total: formatMoney(overdueTotal) },
                "Overdue receivables ({count} · {total})",
              )}
            </h3>
            <ul className="mt-3 space-y-1.5">
              {overdue.slice(0, 10).map((inv) => (
                <li key={inv.id} className="flex items-center justify-between text-sm">
                  <Link href={`/studio/finance/invoices/${inv.id}`} className="font-mono text-xs">
                    {inv.number}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[var(--p-text-2)]">
                      {t("console.finance.treasury.dueLabel", { date: fmtDate(inv.due_at) }, "due {date}")}
                    </span>
                    <span className="font-mono text-xs">{formatMoney(inv.amount_cents, inv.currency)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="text-sm font-semibold">{t("console.finance.treasury.drillIn", undefined, "Drill In")}</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {HUB_TILES.map((tile) => (
              <Link key={tile.href} href={tile.href} className="surface hover-lift p-4">
                <div className="text-sm font-medium">{tile.label}</div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">{tile.description}</div>
              </Link>
            ))}
          </div>
        </section>

        {stripeEvents.length === 0 && (
          <EmptyState
            size="compact"
            title={t(
              "console.finance.treasury.empty.title",
              undefined,
              "No Stripe webhook activity in the last 30 days",
            )}
            description={t(
              "console.finance.treasury.empty.description",
              undefined,
              "Connect Stripe via Settings → Integrations to see live webhook events here.",
            )}
          />
        )}
      </div>
    </>
  );
}
