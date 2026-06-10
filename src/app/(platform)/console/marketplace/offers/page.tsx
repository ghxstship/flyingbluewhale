import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { STATUS_TONE } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type OfferRow = {
  id: string;
  performance_date: string;
  fee_cents: number;
  currency: string;
  talent_offer_state: string;
  deposit_pct: number;
  talent_profile_id: string;
  sent_at: string | null;
  accepted_at: string | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.marketplace.offers.eyebrow", undefined, "Marketplace")}
          title={t("console.marketplace.offers.title", undefined, "Offers")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.marketplace.offers.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("talent_offers")
    .select(
      "id, performance_date, fee_cents, currency, talent_offer_state, deposit_pct, talent_profile_id, sent_at, accepted_at",
    )
    .eq("org_id", session.orgId)
    .order("performance_date", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as OfferRow[];
  const live = rows.filter((r) => r.talent_offer_state === "sent" || r.talent_offer_state === "countered").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.offers.eyebrow", undefined, "Marketplace")}
        title={t("console.marketplace.offers.title", undefined, "Offers")}
        subtitle={t(
          "console.marketplace.offers.subtitle",
          { total: rows.length, live },
          `${rows.length} Total · ${live} Active`,
        )}
        action={
          <Button href="/console/marketplace/offers/new" size="sm">
            {t("console.marketplace.offers.newOffer", undefined, "+ New Offer")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <DataTable<OfferRow>
          rows={rows}
          rowHref={(r) => `/console/marketplace/offers/${r.id}`}
          emptyLabel={t("console.marketplace.offers.emptyLabel", undefined, "No offers yet")}
          emptyDescription={t(
            "console.marketplace.offers.emptyDescription",
            undefined,
            "An offer locks date / fee / slot / rider before contracting.",
          )}
          emptyAction={
            <Button href="/console/marketplace/offers/new" size="sm">
              {t("console.marketplace.offers.newOffer", undefined, "+ New Offer")}
            </Button>
          }
          columns={[
            {
              key: "date",
              header: t("console.marketplace.offers.columns.performance", undefined, "Performance"),
              render: (r) => r.performance_date,
              accessor: (r) => r.performance_date,
              className: "font-mono text-xs",
            },
            {
              key: "fee",
              header: t("console.marketplace.offers.columns.fee", undefined, "Fee"),
              render: (r) => formatMoney(r.fee_cents),
              accessor: (r) => Number(r.fee_cents),
              className: "font-mono text-xs",
            },
            {
              key: "deposit",
              header: t("console.marketplace.offers.columns.deposit", undefined, "Deposit"),
              render: (r) => `${r.deposit_pct}%`,
              accessor: (r) => Number(r.deposit_pct ?? 0),
              className: "font-mono text-xs",
            },
            {
              key: "talent_offer_state",
              header: t("console.marketplace.offers.columns.status", undefined, "Status"),
              render: (r) => (
                <Badge variant={STATUS_TONE[r.talent_offer_state] ?? "muted"}>{toTitle(r.talent_offer_state)}</Badge>
              ),
              accessor: (r) => r.talent_offer_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
