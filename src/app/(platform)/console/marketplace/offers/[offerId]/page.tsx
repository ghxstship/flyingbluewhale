import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import { STATUS_TONE } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { OfferControls } from "./OfferControls";

export const dynamic = "force-dynamic";

type Offer = {
  id: string;
  performance_date: string;
  fee_cents: number;
  currency: string;
  deposit_pct: number;
  balance_terms: string;
  status: string;
  talent_profile_id: string;
  project_id: string | null;
  slot_start: string | null;
  slot_end: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  contracted_at: string | null;
};

export default async function Page({ params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  if (!hasSupabase) return notFound();
  const { t } = await getRequestT();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("talent_offers")
    .select("*")
    .eq("id", offerId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) return notFound();
  const o = data as Offer;

  const talentResp = await supabase
    .from("talent_profiles")
    .select("id, act_name, public_handle")
    .eq("id", o.talent_profile_id)
    .maybeSingle();
  const talent = talentResp.data as { id: string; act_name: string; public_handle: string | null } | null;

  const depositCents = Math.round(o.fee_cents * (o.deposit_pct / 100));
  const balanceCents = o.fee_cents - depositCents;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.offers.detail.eyebrow", undefined, "Marketplace · Offer")}
        title={talent?.act_name ?? t("console.marketplace.offers.detail.fallbackTitle", undefined, "Offer")}
        subtitle={`${o.performance_date} · ${formatMoney(o.fee_cents)}`}
        action={<Badge variant={STATUS_TONE[o.status] ?? "muted"}>{toTitle(o.status)}</Badge>}
      />
      <div className="page-content space-y-5">
        <OfferControls offerId={o.id} status={o.status} />

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
              {t("console.marketplace.offers.detail.termsHeading", undefined, "Terms")}
            </h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--text-secondary)]">
                {t("console.marketplace.offers.detail.feeLabel", undefined, "Fee")}
              </dt>
              <dd className="font-mono">{formatMoney(o.fee_cents)}</dd>
              <dt className="text-[var(--text-secondary)]">
                {t("console.marketplace.offers.detail.depositLabel", undefined, "Deposit")}
              </dt>
              <dd className="font-mono">
                {o.deposit_pct}% · {formatMoney(depositCents)}
              </dd>
              <dt className="text-[var(--text-secondary)]">
                {t("console.marketplace.offers.detail.balanceLabel", undefined, "Balance")}
              </dt>
              <dd className="font-mono">
                {t(
                  "console.marketplace.offers.detail.balanceOn",
                  { amount: formatMoney(balanceCents), terms: toTitle(o.balance_terms) },
                  `${formatMoney(balanceCents)} on ${toTitle(o.balance_terms)}`,
                )}
              </dd>
              <dt className="text-[var(--text-secondary)]">
                {t("console.marketplace.offers.detail.slotLabel", undefined, "Slot")}
              </dt>
              <dd>{o.slot_start ? `${new Date(o.slot_start).toLocaleString()}` : "—"}</dd>
              <dt className="text-[var(--text-secondary)]">
                {t("console.marketplace.offers.detail.projectLabel", undefined, "Project")}
              </dt>
              <dd>{o.project_id ?? "—"}</dd>
            </dl>
          </div>
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
              {t("console.marketplace.offers.detail.timelineHeading", undefined, "Timeline")}
            </h2>
            <ul className="space-y-1.5 text-sm">
              <li>
                {t("console.marketplace.offers.detail.timelineCreated", undefined, "Created")} · {/* via created_at */}{" "}
                —
              </li>
              <li>
                {t("console.marketplace.offers.detail.timelineSent", undefined, "Sent")} ·{" "}
                {o.sent_at ? new Date(o.sent_at).toLocaleString() : "—"}
              </li>
              <li>
                {t("console.marketplace.offers.detail.timelineAccepted", undefined, "Accepted")} ·{" "}
                {o.accepted_at ? new Date(o.accepted_at).toLocaleString() : "—"}
              </li>
              <li>
                {t("console.marketplace.offers.detail.timelineContracted", undefined, "Contracted")} ·{" "}
                {o.contracted_at ? new Date(o.contracted_at).toLocaleString() : "—"}
              </li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
