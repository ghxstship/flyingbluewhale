import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { STATUS_TONE } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { MyOfferActions } from "./MyOfferActions";
import { DEPOSIT_PCT_DEFAULT, BALANCE_PCT_DEFAULT } from "@/lib/payment-terms";

export const dynamic = "force-dynamic";

type Offer = {
  id: string;
  performance_date: string;
  fee_cents: number;
  currency: string;
  talent_offer_state: string;
  deposit_pct: number;
  balance_terms: string;
  org_id: string;
  talent_profile_id: string;
};

export default async function Page() {
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();
  if (!hasSupabase) return <div>{t("me.offers.configureSupabase", undefined, "Configure Supabase.")}</div>;
  const session = await requireSession();
  const supabase = await createClient();

  const profilesResp = await supabase.from("talent_profiles").select("id, act_name").eq("user_id", session.userId);
  const profiles = (profilesResp.data ?? []) as Array<{ id: string; act_name: string }>;
  const profileIds = profiles.map((p) => p.id);
  const actNameByProfile = new Map(profiles.map((p) => [p.id, p.act_name]));

  let offers: Offer[] = [];
  if (profileIds.length > 0) {
    const { data } = await supabase
      .from("talent_offers")
      .select(
        "id, performance_date, fee_cents, currency, talent_offer_state, deposit_pct, balance_terms, org_id, talent_profile_id",
      )
      .in("talent_profile_id", profileIds)
      .order("performance_date", { ascending: false })
      .limit(200);
    offers = (data ?? []) as Offer[];
  }

  // Buyer-org names. The recipient isn't a member of the sending org, so the
  // member-only `orgs_select` policy hides the name from the user client —
  // hydrate the label (name only) via the service client for offers the user
  // already legitimately sees (AUDIT C-25: cards omitted who is offering).
  const buyerNameByOrg = new Map<string, string>();
  const orgIds = Array.from(new Set(offers.map((o) => o.org_id)));
  if (orgIds.length > 0 && isServiceClientAvailable()) {
    const service = createServiceClient();
    const { data: orgs } = await service.from("orgs").select("id, name").in("id", orgIds);
    for (const o of (orgs ?? []) as Array<{ id: string; name: string }>) {
      buyerNameByOrg.set(o.id, o.name);
    }
  }

  const balanceLabel = (terms: string) =>
    terms === "load_in"
      ? t("me.offers.balanceTerms.loadIn", undefined, "balance due on load-in")
      : t("me.offers.balanceTerms.generic", { terms: toTitle(terms) }, `balance due: ${toTitle(terms)}`);

  return (
    <div>
      <div className="text-label text-[var(--color-text-tertiary)]">
        {t("me.offers.eyebrow", undefined, "My offers")}
      </div>
      <h1 className="text-display mt-1 text-3xl">{t("me.offers.title", undefined, "Booking Offers")}</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        {t(
          "me.offers.subtitle",
          undefined,
          `Offers sent to acts you're attached to. Default ${DEPOSIT_PCT_DEFAULT}/${BALANCE_PCT_DEFAULT}, balance on load-in.`,
        )}
      </p>

      {offers.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={t("me.offers.empty.title", undefined, "No offers yet")}
            description={t(
              "me.offers.empty.description",
              undefined,
              `Booking offers sent to your acts will appear here. Default terms: ${DEPOSIT_PCT_DEFAULT}% deposit on signature, ${BALANCE_PCT_DEFAULT}% balance on load-in.`,
            )}
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {offers.map((o) => {
            const actName = actNameByProfile.get(o.talent_profile_id) ?? t("me.offers.yourAct", undefined, "Your act");
            const buyerName =
              buyerNameByOrg.get(o.org_id) ?? t("me.offers.unknownBuyer", undefined, "the sending organization");
            const feeLabel = fmt.money(o.fee_cents, o.currency);
            // performance_date is a DATE column ("YYYY-MM-DD"); anchor it to
            // noon UTC so localized formatting can't slip it a calendar day.
            const dateLabel = fmt.date(
              /^\d{4}-\d{2}-\d{2}$/.test(o.performance_date) ? `${o.performance_date}T12:00:00Z` : o.performance_date,
              "long",
            );
            return (
              <li key={o.id} className="card-elevated flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {t("me.offers.cardTitle", { actName, dateLabel }, `${actName} · ${dateLabel}`)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {t("me.offers.fromBuyer", { buyerName }, `From ${buyerName}`)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {t(
                      "me.offers.feeDepositTerms",
                      { fee: feeLabel, pct: o.deposit_pct, balance: balanceLabel(o.balance_terms) },
                      `${feeLabel} · ${o.deposit_pct}% deposit · ${balanceLabel(o.balance_terms)}`,
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {(o.talent_offer_state === "sent" || o.talent_offer_state === "countered") && (
                    <MyOfferActions
                      offerId={o.id}
                      actName={actName}
                      buyerName={buyerName}
                      feeLabel={feeLabel}
                      depositPct={o.deposit_pct}
                      balanceLabel={balanceLabel(o.balance_terms)}
                      dateLabel={dateLabel}
                    />
                  )}
                  <Badge variant={STATUS_TONE[o.talent_offer_state] ?? "muted"}>{toTitle(o.talent_offer_state)}</Badge>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
