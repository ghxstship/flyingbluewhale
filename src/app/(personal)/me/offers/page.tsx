import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { STATUS_TONE } from "@/lib/marketplace";
import { formatMoney } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { MyOfferActions } from "./MyOfferActions";

export const dynamic = "force-dynamic";

type Offer = {
  id: string;
  performance_date: string;
  fee_cents: number;
  currency: string;
  talent_offer_state: string;
  deposit_pct: number;
  talent_profile_id: string;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) return <div>{t("me.offers.configureSupabase", undefined, "Configure Supabase.")}</div>;
  const session = await requireSession();
  const supabase = await createClient();

  const profilesResp = await supabase.from("talent_profiles").select("id").eq("user_id", session.userId);
  const profileIds = ((profilesResp.data ?? []) as Array<{ id: string }>).map((p) => p.id);

  let offers: Offer[] = [];
  if (profileIds.length > 0) {
    const { data } = await supabase
      .from("talent_offers")
      .select("id, performance_date, fee_cents, currency, talent_offer_state, deposit_pct, talent_profile_id")
      .in("talent_profile_id", profileIds)
      .order("performance_date", { ascending: false })
      .limit(200);
    offers = (data ?? []) as Offer[];
  }

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
          "Offers sent to acts you're attached to. Default 60/40, balance on load-in.",
        )}
      </p>

      {offers.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={t("me.offers.empty.title", undefined, "No offers yet")}
            description={t(
              "me.offers.empty.description",
              undefined,
              "Booking offers sent to your acts will appear here. Default terms: 60% deposit on signature, 40% balance on load-in.",
            )}
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {offers.map((o) => (
            <li key={o.id} className="card-elevated flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold">{o.performance_date}</p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {t(
                    "me.offers.feeDeposit",
                    { fee: formatMoney(o.fee_cents), pct: o.deposit_pct },
                    "{fee} · {pct}% deposit",
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {(o.talent_offer_state === "sent" || o.talent_offer_state === "countered") && (
                  <MyOfferActions offerId={o.id} />
                )}
                <Badge variant={STATUS_TONE[o.talent_offer_state] ?? "muted"}>{toTitle(o.talent_offer_state)}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
