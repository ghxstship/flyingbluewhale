import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { formatMoney } from "@/lib/i18n/format";
import { STATUS_TONE } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type DealRow = {
  id: string;
  performance_date: string;
  fee_cents: number;
  guarantee_cents: number | null;
  door_pct: number | null;
  deal_type: string;
  talent_offer_state: string;
  deposit_pct: number;
  talent_profile_id: string;
  sent_at: string | null;
};

const STAGE_BUCKETS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  countered: "Countered",
  accepted: "Accepted",
  contracted: "Contracted",
  declined: "Declined",
  cancelled: "Cancelled",
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.bookings.deals.eyebrow", undefined, "Bookings")}
          title={t("console.bookings.deals.title", undefined, "Deal Tracker")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.bookings.deals.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("talent_offers")
    .select(
      "id, performance_date, fee_cents, guarantee_cents, door_pct, deal_type, talent_offer_state, deposit_pct, talent_profile_id, sent_at",
    )
    .eq("org_id", session.orgId)
    .order("performance_date", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as DealRow[];
  const live = rows.filter((r) => ["sent", "countered"].includes(r.talent_offer_state)).length;
  const stuck = rows.filter((r) => {
    if (r.talent_offer_state !== "sent" || !r.sent_at) return false;
    const ageDays = (Date.now() - new Date(r.sent_at).getTime()) / 86_400_000;
    return ageDays > 7;
  }).length;
  const totalFee = rows.reduce((s, r) => s + (r.fee_cents ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.bookings.deals.eyebrow", undefined, "Bookings")}
        title={t("console.bookings.deals.title", undefined, "Deal Tracker")}
        subtitle={t(
          "console.bookings.deals.subtitle",
          { count: rows.length, live, stuck },
          `${rows.length} deals · ${live} Active  · ${stuck} stuck >7d`,
        )}
        action={
          <Button href="/studio/marketplace/offers/new" size="sm">
            {t("console.bookings.deals.newDeal", undefined, "+ New Deal")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.bookings.deals.metric.activeDeals", undefined, "Active Deals")}
            value={fmt.number(live)}
            accent
          />
          <MetricCard
            label={t("console.bookings.deals.metric.stuck", undefined, "Stuck >7d")}
            value={fmt.number(stuck)}
          />
          <MetricCard
            label={t("console.bookings.deals.metric.totalFeeVolume", undefined, "Total Fee Volume")}
            value={formatMoney(totalFee)}
          />
        </div>

        <DataTable<DealRow>
          rows={rows}
          rowHref={(r) => `/studio/bookings/deals/${r.id}`}
          emptyLabel={t("console.bookings.deals.empty.label", undefined, "No Deals Yet")}
          emptyDescription={t(
            "console.bookings.deals.empty.description",
            undefined,
            "A deal is the booking-side view of a talent offer — track fees, guarantees, deposits, and stage as each booking moves to contracted.",
          )}
          emptyAction={
            <Button href="/studio/marketplace/offers/new" size="sm">
              {t("console.bookings.deals.createFirst", undefined, "Start Your First Deal")}
            </Button>
          }
          columns={[
            {
              key: "date",
              header: t("console.bookings.deals.col.performance", undefined, "Performance"),
              render: (r) => r.performance_date,
              accessor: (r) => r.performance_date,
              className: "font-mono text-xs",
            },
            {
              key: "type",
              header: t("console.bookings.deals.col.dealType", undefined, "Deal Type"),
              render: (r) => <Badge variant="muted">{toTitle(r.deal_type)}</Badge>,
              accessor: (r) => r.deal_type,
              filterable: true,
              groupable: true,
            },
            {
              key: "fee",
              header: t("console.bookings.deals.col.feeGuar", undefined, "Fee / Guar"),
              render: (r) => formatMoney(r.guarantee_cents ?? r.fee_cents),
              accessor: (r) => Number(r.guarantee_cents ?? r.fee_cents),
              className: "font-mono text-xs",
            },
            {
              key: "door",
              header: t("console.bookings.deals.col.door", undefined, "Door %"),
              render: (r) => (r.door_pct == null ? "—" : `${r.door_pct}%`),
              accessor: (r) => Number(r.door_pct ?? 0),
              className: "font-mono text-xs",
            },
            {
              key: "deposit",
              header: t("console.bookings.deals.col.deposit", undefined, "Deposit"),
              render: (r) => `${r.deposit_pct}%`,
              accessor: (r) => Number(r.deposit_pct ?? 0),
              className: "font-mono text-xs",
            },
            {
              key: "stage",
              header: t("console.bookings.deals.col.stage", undefined, "Stage"),
              render: (r) => (
                <Badge variant={STATUS_TONE[r.talent_offer_state] ?? "muted"}>
                  {STAGE_BUCKETS[r.talent_offer_state] ?? r.talent_offer_state}
                </Badge>
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
