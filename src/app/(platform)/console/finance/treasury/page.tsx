import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type InvoiceRow = {
  id: string;
  number: string;
  amount_cents: number;
  currency: string;
  status: string;
  due_at: string | null;
};

type ExpenseRow = {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
};

type StripeEventRow = {
  event_id: string;
  type: string;
  received_at: string;
};

const HUB_TILES: Array<{ href: string; label: string; description: string }> = [
  { href: "/console/finance/invoices", label: "Invoices", description: "Receivables — issued, sent, paid" },
  { href: "/console/finance/expenses", label: "Expenses", description: "Payables awaiting reimbursement" },
  { href: "/console/finance/budgets", label: "Budgets", description: "Project P&L envelopes" },
  { href: "/console/finance/payouts", label: "Payouts", description: "Stripe Connect supplier payments" },
];

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Finance" title="Treasury" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
      .select("id, number, amount_cents, currency, status, due_at")
      .eq("org_id", session.orgId)
      .order("issued_at", { ascending: false })
      .limit(500),
    supabase
      .from("expenses")
      .select("id, amount_cents, currency, status")
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
    if (inv.status === "paid") cur.paid += inv.amount_cents;
    else if (["sent", "overdue", "draft"].includes(inv.status)) cur.outstanding += inv.amount_cents;
    map.set(inv.currency, cur);
    return map;
  }, new Map());

  const expByCurrency = expenses.reduce<Map<string, number>>((map, ex) => {
    if (["pending", "approved"].includes(ex.status)) {
      map.set(ex.currency, (map.get(ex.currency) ?? 0) + ex.amount_cents);
    }
    return map;
  }, new Map());

  const overdue = invoices.filter((i) => i.due_at && new Date(i.due_at).getTime() < Date.now() && i.status !== "paid");
  const overdueTotal = overdue.reduce((s, i) => s + i.amount_cents, 0);

  return (
    <>
      <ModuleHeader eyebrow="Finance" title="Treasury" subtitle="Cash position, receivables, payables." />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label="Outstanding Receivables"
            value={fmt.number(Array.from(byCurrency.values()).reduce((s, v) => s + v.outstanding, 0))}
            accent
          />
          <MetricCard
            label="Pending Payables"
            value={fmt.number(Array.from(expByCurrency.values()).reduce((s, v) => s + v, 0))}
          />
          <MetricCard label="Stripe Events · 30d" value={fmt.number(stripeEvents.length)} />
        </div>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">By Currency</h3>
          {byCurrency.size === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">No invoices issued yet.</p>
          ) : (
            <table className="data-table mt-3 w-full text-sm">
              <thead>
                <tr>
                  <th>Currency</th>
                  <th className="text-end">Paid</th>
                  <th className="text-end">Outstanding</th>
                  <th className="text-end">Pending payables</th>
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
              Overdue receivables ({overdue.length} · {formatMoney(overdueTotal)})
            </h3>
            <ul className="mt-3 space-y-1.5">
              {overdue.slice(0, 10).map((inv) => (
                <li key={inv.id} className="flex items-center justify-between text-sm">
                  <Link href={`/console/finance/invoices/${inv.id}`} className="font-mono text-xs">
                    {inv.number}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[var(--text-muted)]">due {fmtDate(inv.due_at)}</span>
                    <span className="font-mono text-xs">{formatMoney(inv.amount_cents, inv.currency)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="text-sm font-semibold">Drill In</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {HUB_TILES.map((t) => (
              <Link key={t.href} href={t.href} className="surface hover-lift p-4">
                <div className="text-sm font-medium">{t.label}</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">{t.description}</div>
              </Link>
            ))}
          </div>
        </section>

        {stripeEvents.length === 0 && (
          <EmptyState
            size="compact"
            title="No Stripe webhook activity in the last 30 days"
            description="Connect Stripe via Settings → Integrations to see live webhook events here."
          />
        )}
      </div>
    </>
  );
}
