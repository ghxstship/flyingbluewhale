import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { STATUS_TONE } from "@/lib/marketplace";
import { getRequestT } from "@/lib/i18n/request";
import { upsertSettlementAction, finalizeSettlementAction } from "./actions";

export const dynamic = "force-dynamic";

type Settlement = {
  id: string;
  show_date: string;
  settlement_state: string;
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
  const supabase = await createClient();
  const { t } = await getRequestT();

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
  const isFinal = s?.settlement_state === "final";

  return (
    <>
      <ModuleHeader
        eyebrow={t(
          "console.bookings.deals.settlement.eyebrow",
          { date: offer.performance_date },
          `Settlement · ${offer.performance_date}`,
        )}
        title={t("console.bookings.deals.settlement.title", undefined, "Post-Show Reconciliation")}
        action={s && <Badge variant={STATUS_TONE[s.settlement_state] ?? "muted"}>{toTitle(s.settlement_state)}</Badge>}
      />
      <div className="page-content max-w-3xl space-y-5">
        {s && (
          <section className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
              {t("console.bookings.deals.settlement.computed", undefined, "Computed")}
            </h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--p-text-2)]">
                {t("console.bookings.deals.settlement.nbor", undefined, "NBOR")}
              </dt>
              <dd className="font-mono">{formatMoney(s.nbor_cents)}</dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.bookings.deals.settlement.balanceDue", undefined, "Balance Due")}
              </dt>
              <dd className="font-mono">{formatMoney(s.balance_due_cents)}</dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.bookings.deals.settlement.totalAncillary", undefined, "Total Ancillary")}
              </dt>
              <dd className="font-mono">
                {formatMoney(s.bar_revenue_cents + s.merch_revenue_cents + s.other_revenue_cents)}
              </dd>
            </dl>
          </section>
        )}

        <FormShell
          action={upsertSettlementAction}
          submitLabel={
            s
              ? t("common.update", undefined, "Update")
              : t("console.bookings.deals.settlement.create", undefined, "Create Settlement")
          }
        >
          <input type="hidden" name="offer_id" value={offer.id} />
          <Input
            label={t("console.bookings.deals.settlement.showDate", undefined, "Show Date")}
            name="show_date"
            type="date"
            required
            defaultValue={s?.show_date ?? offer.performance_date}
          />

          <fieldset className="surface-inset p-3">
            <legend className="text-xs font-medium tracking-wide uppercase">
              {t("console.bookings.deals.settlement.revenue", undefined, "Revenue")}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t("console.bookings.deals.settlement.grossBoxOffice", undefined, "Gross Box Office")}
                name="gross_box_office"
                placeholder="0.00"
                defaultValue={dollars(s?.gross_box_office_cents)}
              />
              <Input
                label={t("console.bookings.deals.settlement.paidAttendance", undefined, "Paid Attendance")}
                name="paid_attendance"
                type="number"
                defaultValue={s?.paid_attendance ?? 0}
              />
              <Input
                label={t("console.bookings.deals.settlement.comps", undefined, "Comps")}
                name="comp_count"
                type="number"
                defaultValue={s?.comp_count ?? 0}
              />
              <Input
                label={t("console.bookings.deals.settlement.walkouts", undefined, "Walkouts")}
                name="walkout_count"
                type="number"
                defaultValue={s?.walkout_count ?? 0}
              />
              <Input
                label={t("console.bookings.deals.settlement.bar", undefined, "Bar")}
                name="bar_revenue"
                placeholder="0.00"
                defaultValue={dollars(s?.bar_revenue_cents)}
              />
              <Input
                label={t("console.bookings.deals.settlement.merch", undefined, "Merch")}
                name="merch_revenue"
                placeholder="0.00"
                defaultValue={dollars(s?.merch_revenue_cents)}
              />
              <Input
                label={t("console.bookings.deals.settlement.other", undefined, "Other")}
                name="other_revenue"
                placeholder="0.00"
                defaultValue={dollars(s?.other_revenue_cents)}
              />
            </div>
          </fieldset>

          <fieldset className="surface-inset p-3">
            <legend className="text-xs font-medium tracking-wide uppercase">
              {t("console.bookings.deals.settlement.deductions", undefined, "Deductions (NBOR Inputs)")}
            </legend>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label={t("console.bookings.deals.settlement.salesTax", undefined, "Sales Tax")}
                name="sales_tax"
                placeholder="0.00"
                defaultValue={dollars(s?.sales_tax_cents)}
              />
              <Input
                label={t("console.bookings.deals.settlement.amusementTax", undefined, "Amusement Tax")}
                name="amusement_tax"
                placeholder="0.00"
                defaultValue={dollars(s?.amusement_tax_cents)}
              />
              <Input
                label={t("console.bookings.deals.settlement.ccFees", undefined, "CC Fees")}
                name="cc_fee"
                placeholder="0.00"
                defaultValue={dollars(s?.cc_fee_cents)}
              />
            </div>
          </fieldset>

          <fieldset className="surface-inset p-3">
            <legend className="text-xs font-medium tracking-wide uppercase">
              {t("console.bookings.deals.settlement.splitsPayouts", undefined, "Splits + Payouts")}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t("console.bookings.deals.settlement.artistPayout", undefined, "Artist Payout")}
                name="artist_payout"
                placeholder="0.00"
                defaultValue={dollars(s?.artist_payout_cents)}
              />
              <Input
                label={t("console.bookings.deals.settlement.agentCommission", undefined, "Agent Commission")}
                name="agent_commission"
                placeholder="0.00"
                defaultValue={dollars(s?.agent_commission_cents)}
              />
              <Input
                label={t("console.bookings.deals.settlement.supportAct", undefined, "Support Act")}
                name="support_act_payout"
                placeholder="0.00"
                defaultValue={dollars(s?.support_act_payout_cents)}
              />
              <Input
                label={t("console.bookings.deals.settlement.depositReceived", undefined, "Deposit Received")}
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
              {t("console.bookings.deals.settlement.finalize", undefined, "Finalize Settlement")}
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
