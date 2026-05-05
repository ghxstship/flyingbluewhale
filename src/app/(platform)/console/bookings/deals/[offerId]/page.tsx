import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/i18n/format";
import { STATUS_TONE, computeBreakEven } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

type Deal = {
  id: string;
  performance_date: string;
  fee_cents: number;
  guarantee_cents: number | null;
  door_pct: number | null;
  walkout_threshold_cents: number | null;
  ticket_scaling: Array<{ tier: string; price_cents: number; count: number }>;
  expense_estimate: Record<string, number>;
  break_even_attendance: number | null;
  agent_commission_bps: number;
  deposit_pct: number;
  deal_type: string;
  status: string;
  talent_profile_id: string;
  co_pro_partners: Array<{ org_name: string; split_pct: number }>;
};

export default async function Page({ params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase
    .from("talent_offers")
    .select("*")
    .eq("id", offerId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) return notFound();
  const d = data as Deal;

  const settlementResp = await supabase
    .from("settlements")
    .select("id, status")
    .eq("talent_offer_id", d.id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  const settlement = settlementResp.data as { id: string; status: string } | null;

  // Break-even compute. Estimate total expenses + guarantee, divide by avg
  // ticket price across ticket_scaling.
  const scaling = Array.isArray(d.ticket_scaling) ? d.ticket_scaling : [];
  const totalSeats = scaling.reduce((s, t) => s + (t.count ?? 0), 0) || 0;
  const avgTicketCents =
    totalSeats > 0
      ? Math.round(scaling.reduce((s, t) => s + (t.price_cents ?? 0) * (t.count ?? 0), 0) / totalSeats)
      : null;
  const expenseTotal = Object.values(d.expense_estimate ?? {}).reduce(
    (s: number, v) => s + (typeof v === "number" ? v : 0),
    0,
  );
  const breakEven =
    d.break_even_attendance ??
    computeBreakEven({
      guaranteeCents: d.guarantee_cents,
      expenseCents: expenseTotal,
      avgTicketCents,
      taxRateBps: 800,
      ccFeeRateBps: 290,
    });

  return (
    <>
      <ModuleHeader
        eyebrow={`Bookings · ${d.deal_type}`}
        title={d.performance_date}
        subtitle={`Fee ${formatMoney(d.guarantee_cents ?? d.fee_cents)} · ${d.deposit_pct}% deposit`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[d.status] ?? "muted"}>{d.status}</Badge>
            <Button href={`/console/marketplace/offers/${d.id}`} size="sm" variant="ghost">
              Offer view
            </Button>
            <Button href={`/console/bookings/deals/${d.id}/settlement`} size="sm">
              {settlement ? "Open Settlement" : "Start Settlement"}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Deal Terms</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--text-secondary)]">Type</dt>
              <dd>{d.deal_type}</dd>
              <dt className="text-[var(--text-secondary)]">Guarantee</dt>
              <dd className="font-mono">{d.guarantee_cents != null ? formatMoney(d.guarantee_cents) : "—"}</dd>
              <dt className="text-[var(--text-secondary)]">Door %</dt>
              <dd>{d.door_pct != null ? `${d.door_pct}%` : "—"}</dd>
              <dt className="text-[var(--text-secondary)]">Walkout threshold</dt>
              <dd className="font-mono">{d.walkout_threshold_cents ? formatMoney(d.walkout_threshold_cents) : "—"}</dd>
              <dt className="text-[var(--text-secondary)]">Agent commission</dt>
              <dd>{(d.agent_commission_bps / 100).toFixed(2)}%</dd>
            </dl>
          </div>
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Break-even</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--text-secondary)]">Total seats</dt>
              <dd className="font-mono">{totalSeats}</dd>
              <dt className="text-[var(--text-secondary)]">Avg ticket</dt>
              <dd className="font-mono">{avgTicketCents != null ? formatMoney(avgTicketCents) : "—"}</dd>
              <dt className="text-[var(--text-secondary)]">Estimated expenses</dt>
              <dd className="font-mono">{formatMoney(expenseTotal)}</dd>
              <dt className="text-[var(--text-secondary)]">Break-even @ avg</dt>
              <dd className="font-mono">{breakEven != null ? `${breakEven} seats` : "—"}</dd>
            </dl>
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Ticket Scaling</h2>
          {scaling.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No scaling defined.</p>
          ) : (
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>Tier</th>
                  <th>Price</th>
                  <th>Count</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {scaling.map((t, i) => (
                  <tr key={i}>
                    <td>{t.tier}</td>
                    <td className="font-mono">{formatMoney(t.price_cents)}</td>
                    <td className="font-mono">{t.count}</td>
                    <td className="font-mono">{formatMoney(t.price_cents * t.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {d.co_pro_partners.length > 0 && (
          <section className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Co-Pro Partners</h2>
            <ul className="space-y-1 text-sm">
              {d.co_pro_partners.map((p, i) => (
                <li key={i} className="font-mono">
                  {p.org_name} — {p.split_pct}%
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
