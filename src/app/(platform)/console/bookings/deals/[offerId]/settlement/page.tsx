import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/i18n/format";
import { STATUS_TONE } from "@/lib/marketplace";
import { upsertSettlementAction, finalizeSettlementAction } from "./actions";

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
};

type Offer = {
  id: string;
  performance_date: string;
  guarantee_cents: number | null;
  fee_cents: number;
  deposit_pct: number;
};

const dollars = (cents: number | null | undefined) => (cents == null ? "" : (cents / 100).toFixed(2));

export default async function Page({ params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const offerResp = await supabase
    .from("talent_offers")
    .select("id, performance_date, guarantee_cents, fee_cents, deposit_pct")
    .eq("id", offerId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!offerResp.data) return notFound();
  const offer = offerResp.data as Offer;

  const settlementResp = await supabase
    .from("settlements")
    .select("*")
    .eq("talent_offer_id", offerId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  const s = (settlementResp.data ?? null) as Settlement | null;
  const isFinal = s?.status === "final";

  return (
    <>
      <ModuleHeader
        eyebrow={`Settlement · ${offer.performance_date}`}
        title="Post-Show Reconciliation"
        subtitle="NBOR auto-computed = GBOR − sales tax − amusement tax − CC fees. Balance recomputes on save."
        action={s && <Badge variant={STATUS_TONE[s.status] ?? "muted"}>{s.status}</Badge>}
      />
      <div className="page-content max-w-3xl space-y-5">
        {s && (
          <section className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Computed</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--text-secondary)]">NBOR</dt>
              <dd className="font-mono">{formatMoney(s.nbor_cents)}</dd>
              <dt className="text-[var(--text-secondary)]">Balance Due</dt>
              <dd className="font-mono">{formatMoney(s.balance_due_cents)}</dd>
              <dt className="text-[var(--text-secondary)]">Total Ancillary</dt>
              <dd className="font-mono">
                {formatMoney(s.bar_revenue_cents + s.merch_revenue_cents + s.other_revenue_cents)}
              </dd>
            </dl>
          </section>
        )}

        <FormShell action={upsertSettlementAction} submitLabel={s ? "Update" : "Create Settlement"}>
          <input type="hidden" name="offer_id" value={offer.id} />
          <Input
            label="Show Date"
            name="show_date"
            type="date"
            required
            defaultValue={s?.show_date ?? offer.performance_date}
          />

          <fieldset className="surface-inset p-3">
            <legend className="text-xs font-medium tracking-wide uppercase">Revenue</legend>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Gross Box Office"
                name="gross_box_office"
                placeholder="0.00"
                defaultValue={dollars(s?.gross_box_office_cents)}
              />
              <Input
                label="Paid Attendance"
                name="paid_attendance"
                type="number"
                defaultValue={s?.paid_attendance ?? 0}
              />
              <Input label="Comps" name="comp_count" type="number" defaultValue={s?.comp_count ?? 0} />
              <Input label="Walkouts" name="walkout_count" type="number" defaultValue={s?.walkout_count ?? 0} />
              <Input label="Bar" name="bar_revenue" placeholder="0.00" defaultValue={dollars(s?.bar_revenue_cents)} />
              <Input
                label="Merch"
                name="merch_revenue"
                placeholder="0.00"
                defaultValue={dollars(s?.merch_revenue_cents)}
              />
              <Input
                label="Other"
                name="other_revenue"
                placeholder="0.00"
                defaultValue={dollars(s?.other_revenue_cents)}
              />
            </div>
          </fieldset>

          <fieldset className="surface-inset p-3">
            <legend className="text-xs font-medium tracking-wide uppercase">Deductions (NBOR inputs)</legend>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Sales Tax" name="sales_tax" placeholder="0.00" defaultValue={dollars(s?.sales_tax_cents)} />
              <Input
                label="Amusement Tax"
                name="amusement_tax"
                placeholder="0.00"
                defaultValue={dollars(s?.amusement_tax_cents)}
              />
              <Input label="CC Fees" name="cc_fee" placeholder="0.00" defaultValue={dollars(s?.cc_fee_cents)} />
            </div>
          </fieldset>

          <fieldset className="surface-inset p-3">
            <legend className="text-xs font-medium tracking-wide uppercase">Splits + Payouts</legend>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Artist Payout"
                name="artist_payout"
                placeholder="0.00"
                defaultValue={dollars(s?.artist_payout_cents)}
              />
              <Input
                label="Agent Commission"
                name="agent_commission"
                placeholder="0.00"
                defaultValue={dollars(s?.agent_commission_cents)}
              />
              <Input
                label="Support Act"
                name="support_act_payout"
                placeholder="0.00"
                defaultValue={dollars(s?.support_act_payout_cents)}
              />
              <Input
                label="Deposit Received"
                name="deposit_received"
                placeholder="0.00"
                defaultValue={dollars(s?.deposit_received_cents)}
              />
            </div>
          </fieldset>
        </FormShell>

        {s && !isFinal && (
          <form
            action={async (fd) => {
              "use server";
              await finalizeSettlementAction(null, fd);
            }}
          >
            <input type="hidden" name="offer_id" value={offer.id} />
            <Button type="submit" variant="primary">
              Finalize Settlement
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
