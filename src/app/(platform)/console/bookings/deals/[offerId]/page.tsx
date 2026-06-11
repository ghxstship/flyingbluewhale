import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/i18n/format";
import { STATUS_TONE, computeBreakEven } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { addCoProPartnerAction, removeCoProPartnerAction } from "./co-pro/actions";

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
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data } = await supabase
    .from("talent_offers")
    .select("*")
    .eq("id", offerId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) return notFound();
  // Cast through unknown — the typed row's narrow type doesn't overlap
  // with the local Deal alias because Deal is a hand-written subset.
  const d = data as unknown as Deal;

  const settlementResp = await supabase
    .from("settlements")
    .select("id, status:settlement_state")
    .eq("talent_offer_id", d.id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  const settlement = settlementResp.data as { id: string; settlement_state: string } | null;

  // Break-even compute. Estimate total expenses + guarantee, divide by avg
  // ticket price across ticket_scaling.
  const scaling = Array.isArray(d.ticket_scaling) ? d.ticket_scaling : [];
  const totalSeats = scaling.reduce((s, tier) => s + (tier.count ?? 0), 0) || 0;
  const avgTicketCents =
    totalSeats > 0
      ? Math.round(scaling.reduce((s, tier) => s + (tier.price_cents ?? 0) * (tier.count ?? 0), 0) / totalSeats)
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
        eyebrow={t("console.bookings.deals.detail.eyebrow", { dealType: d.deal_type }, `Bookings · ${d.deal_type}`)}
        title={d.performance_date}
        subtitle={t(
          "console.bookings.deals.detail.subtitle",
          { fee: formatMoney(d.guarantee_cents ?? d.fee_cents), depositPct: d.deposit_pct },
          `Fee ${formatMoney(d.guarantee_cents ?? d.fee_cents)} · ${d.deposit_pct}% deposit`,
        )}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[d.status] ?? "muted"}>{toTitle(d.status)}</Badge>
            <Button href={`/console/marketplace/offers/${d.id}`} size="sm" variant="ghost">
              {t("console.bookings.deals.detail.offerView", undefined, "Offer view")}
            </Button>
            <Button href={`/console/bookings/deals/${d.id}/settlement`} size="sm">
              {settlement
                ? t("console.bookings.deals.detail.openSettlement", undefined, "Open Settlement")
                : t("console.bookings.deals.detail.startSettlement", undefined, "Start Settlement")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
              {t("console.bookings.deals.detail.dealTerms", undefined, "Deal Terms")}
            </h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--p-text-2)]">{t("console.bookings.deals.detail.type", undefined, "Type")}</dt>
              <dd>{toTitle(d.deal_type)}</dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.bookings.deals.detail.guarantee", undefined, "Guarantee")}
              </dt>
              <dd className="font-mono">{d.guarantee_cents != null ? formatMoney(d.guarantee_cents) : "—"}</dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.bookings.deals.detail.doorPct", undefined, "Door %")}
              </dt>
              <dd>{d.door_pct != null ? `${d.door_pct}%` : "—"}</dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.bookings.deals.detail.walkoutThreshold", undefined, "Walkout threshold")}
              </dt>
              <dd className="font-mono">{d.walkout_threshold_cents ? formatMoney(d.walkout_threshold_cents) : "—"}</dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.bookings.deals.detail.agentCommission", undefined, "Agent commission")}
              </dt>
              <dd>{(d.agent_commission_bps / 100).toFixed(2)}%</dd>
            </dl>
          </div>
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
              {t("console.bookings.deals.detail.breakEven", undefined, "Break-even")}
            </h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--p-text-2)]">
                {t("console.bookings.deals.detail.totalSeats", undefined, "Total seats")}
              </dt>
              <dd className="font-mono">{totalSeats}</dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.bookings.deals.detail.avgTicket", undefined, "Avg ticket")}
              </dt>
              <dd className="font-mono">{avgTicketCents != null ? formatMoney(avgTicketCents) : "—"}</dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.bookings.deals.detail.estimatedExpenses", undefined, "Estimated expenses")}
              </dt>
              <dd className="font-mono">{formatMoney(expenseTotal)}</dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.bookings.deals.detail.breakEvenAtAvg", undefined, "Break-even @ avg")}
              </dt>
              <dd className="font-mono">
                {breakEven != null
                  ? t("console.bookings.deals.detail.seatsCount", { count: breakEven }, `${breakEven} seats`)
                  : "—"}
              </dd>
            </dl>
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
            {t("console.bookings.deals.detail.ticketScaling", undefined, "Ticket Scaling")}
          </h2>
          {scaling.length === 0 ? (
            <p className="text-sm text-[var(--p-text-2)]">
              {t("console.bookings.deals.detail.noScalingDefined", undefined, "No scaling defined.")}
            </p>
          ) : (
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.bookings.deals.detail.tierHeader", undefined, "Tier")}</th>
                  <th>{t("console.bookings.deals.detail.priceHeader", undefined, "Price")}</th>
                  <th>{t("console.bookings.deals.detail.countHeader", undefined, "Count")}</th>
                  <th>{t("console.bookings.deals.detail.subtotalHeader", undefined, "Subtotal")}</th>
                </tr>
              </thead>
              <tbody>
                {scaling.map((tier, i) => (
                  <tr key={i}>
                    <td>{tier.tier}</td>
                    <td className="font-mono">{formatMoney(tier.price_cents)}</td>
                    <td className="font-mono">{tier.count}</td>
                    <td className="font-mono">{formatMoney(tier.price_cents * tier.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <CoProSection offerId={d.id} />
      </div>
    </>
  );
}

async function CoProSection({ offerId }: { offerId: string }) {
  const supabase = await createClient();
  const session = await requireSession();
  const { t } = await getRequestT();
  const { data } = await supabase
    .from("co_pro_partnerships")
    .select("id, partner_name, partner_org_id, split_pct, bonus_terms, contact_email, settled_at, settled_amount_cents")
    .eq("talent_offer_id", offerId)
    .eq("org_id", session.orgId)
    .order("created_at");
  const rows = (data ?? []) as Array<{
    id: string;
    partner_name: string;
    partner_org_id: string | null;
    split_pct: number;
    bonus_terms: string | null;
    contact_email: string | null;
    settled_at: string | null;
    settled_amount_cents: number | null;
  }>;
  const totalSplit = rows.reduce((s, r) => s + Number(r.split_pct ?? 0), 0);

  return (
    <section className="surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          {t("console.bookings.deals.detail.coProPartners", undefined, "Co-Pro Partners")}
        </h2>
        <Badge variant={totalSplit > 100 ? "error" : totalSplit === 100 ? "success" : "muted"}>
          {t("console.bookings.deals.detail.pctAllocated", { pct: totalSplit }, `${totalSplit}% allocated`)}
        </Badge>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--p-text-2)]">
          {t(
            "console.bookings.deals.detail.noPartnersAttached",
            undefined,
            "No partners attached. Add a co-pro partner with a split percentage.",
          )}
        </p>
      ) : (
        <ul className="mb-4 divide-y divide-[var(--border-subtle)]">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <span className="font-semibold">{r.partner_name}</span>
                <span className="ms-2 font-mono text-xs">{r.split_pct}%</span>
                {r.contact_email && <span className="ms-2 text-xs text-[var(--p-text-2)]">{r.contact_email}</span>}
                {r.settled_at && (
                  <Badge variant="success" className="ms-2">
                    {t("console.bookings.deals.detail.settledBadge", undefined, "settled")}
                  </Badge>
                )}
              </div>
              <form
                action={async (fd) => {
                  "use server";
                  await removeCoProPartnerAction(null, fd);
                }}
              >
                <input type="hidden" name="partnership_id" value={r.id} />
                <input type="hidden" name="offer_id" value={offerId} />
                <button type="submit" className="ps-btn ps-btn--ghost text-xs">
                  {t("common.remove", undefined, "Remove")}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <FormShell
        action={addCoProPartnerAction}
        submitLabel={t("console.bookings.deals.detail.addPartner", undefined, "Add Partner")}
        className="border-t border-[var(--border-subtle)] pt-4"
      >
        <input type="hidden" name="offer_id" value={offerId} />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("console.bookings.deals.detail.partnerName", undefined, "Partner Name")}
            name="partner_name"
            required
            maxLength={200}
            placeholder={t("console.bookings.deals.detail.partnerNamePlaceholder", undefined, "Goldenvoice")}
          />
          <Input
            label={t("console.bookings.deals.detail.splitPct", undefined, "Split %")}
            name="split_pct"
            type="number"
            min={0}
            max={100}
            required
          />
        </div>
        <Input
          label={t("console.bookings.deals.detail.contactEmail", undefined, "Contact Email")}
          name="contact_email"
          type="email"
        />
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.bookings.deals.detail.bonusTerms", undefined, "Bonus Terms")}
          </label>
          <textarea
            name="bonus_terms"
            rows={3}
            maxLength={2000}
            className="ps-input mt-1.5 w-full"
            placeholder={t(
              "console.bookings.deals.detail.bonusTermsPlaceholder",
              undefined,
              "80/20 over $X NBOR threshold",
            )}
          />
        </div>
      </FormShell>
    </section>
  );
}
