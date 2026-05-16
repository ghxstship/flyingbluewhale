import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatDateTime, formatMoney } from "@/lib/i18n/format";;
import { STATUS_TONE } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

type Settlement = {
  id: string;
  show_date: string;
  status: string;
  gross_box_office_cents: number;
  sales_tax_cents: number;
  amusement_tax_cents: number;
  cc_fee_cents: number;
  nbor_cents: number;
  paid_attendance: number;
  comp_count: number;
  walkout_count: number;
  bar_revenue_cents: number;
  merch_revenue_cents: number;
  other_revenue_cents: number;
  artist_payout_cents: number;
  agent_commission_cents: number;
  support_act_payout_cents: number;
  deposit_received_cents: number;
  balance_due_cents: number;
  finalized_at: string | null;
  talent_offer_id: string | null;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("settlements")
    .select("*")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) return notFound();
  const s = data as Settlement;

  return (
    <>
      <ModuleHeader
        eyebrow="Settlement"
        title={s.show_date}
        subtitle={s.finalized_at ? `Finalized ${formatDateTime(s.finalized_at)}` : "Draft / reconciling"}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[s.status] ?? "muted"}>{s.status}</Badge>
            {s.talent_offer_id && (
              <Button href={`/console/bookings/deals/${s.talent_offer_id}/settlement`} size="sm" variant="ghost">
                Edit on deal
              </Button>
            )}
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-5">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="surface p-4">
            <div className="text-label text-[var(--text-muted)]">GBOR</div>
            <div className="font-mono text-lg">{formatMoney(s.gross_box_office_cents)}</div>
          </div>
          <div className="surface p-4">
            <div className="text-label text-[var(--text-muted)]">NBOR</div>
            <div className="font-mono text-lg">{formatMoney(s.nbor_cents)}</div>
          </div>
          <div className="surface p-4">
            <div className="text-label text-[var(--text-muted)]">Balance Due</div>
            <div className="font-mono text-lg">{formatMoney(s.balance_due_cents)}</div>
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">Revenue</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-[var(--text-secondary)]">Paid attendance</dt>
            <dd className="font-mono">{s.paid_attendance}</dd>
            <dt className="text-[var(--text-secondary)]">Comps</dt>
            <dd className="font-mono">{s.comp_count}</dd>
            <dt className="text-[var(--text-secondary)]">Walkouts</dt>
            <dd className="font-mono">{s.walkout_count}</dd>
            <dt className="text-[var(--text-secondary)]">Bar</dt>
            <dd className="font-mono">{formatMoney(s.bar_revenue_cents)}</dd>
            <dt className="text-[var(--text-secondary)]">Merch</dt>
            <dd className="font-mono">{formatMoney(s.merch_revenue_cents)}</dd>
            <dt className="text-[var(--text-secondary)]">Other</dt>
            <dd className="font-mono">{formatMoney(s.other_revenue_cents)}</dd>
          </dl>
        </section>

        <section className="surface p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">Deductions</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-[var(--text-secondary)]">Sales tax</dt>
            <dd className="font-mono">{formatMoney(s.sales_tax_cents)}</dd>
            <dt className="text-[var(--text-secondary)]">Amusement tax</dt>
            <dd className="font-mono">{formatMoney(s.amusement_tax_cents)}</dd>
            <dt className="text-[var(--text-secondary)]">CC fees</dt>
            <dd className="font-mono">{formatMoney(s.cc_fee_cents)}</dd>
          </dl>
        </section>

        <section className="surface p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">Splits</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-[var(--text-secondary)]">Artist payout</dt>
            <dd className="font-mono">{formatMoney(s.artist_payout_cents)}</dd>
            <dt className="text-[var(--text-secondary)]">Agent commission</dt>
            <dd className="font-mono">{formatMoney(s.agent_commission_cents)}</dd>
            <dt className="text-[var(--text-secondary)]">Support act</dt>
            <dd className="font-mono">{formatMoney(s.support_act_payout_cents)}</dd>
            <dt className="text-[var(--text-secondary)]">Deposit received</dt>
            <dd className="font-mono">{formatMoney(s.deposit_received_cents)}</dd>
          </dl>
        </section>
      </div>
    </>
  );
}
