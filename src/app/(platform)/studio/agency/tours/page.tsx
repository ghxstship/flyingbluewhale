import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
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

type Row = {
  id: string; // alias for tour_id to satisfy DataTable<Row extends { id: string }>
  tour_id: string;
  name: string;
  status: string;
  starts_on: string | null;
  ends_on: string | null;
  leg_count: number;
  settled_legs: number;
  gross_box_office_cents: number;
  nbor_cents: number;
  artist_payout_cents: number;
  agent_commission_cents: number;
  ancillary_revenue_cents: number;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.agency.tours.eyebrow", undefined, "Agency")}
          title={t("console.agency.tours.title", undefined, "Tours")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.agency.tours.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("tour_p_and_l")
    .select("*")
    .eq("org_id", session.orgId)
    .order("starts_on", { ascending: false, nullsFirst: false })
    .limit(200);
  const rows = ((data ?? []) as Array<Omit<Row, "id">>).map((r) => ({ ...r, id: r.tour_id })) as Row[];

  const totalGBOR = rows.reduce((s, r) => s + (r.gross_box_office_cents ?? 0), 0);
  const totalArtist = rows.reduce((s, r) => s + (r.artist_payout_cents ?? 0), 0);
  const totalCommission = rows.reduce((s, r) => s + (r.agent_commission_cents ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.agency.tours.eyebrow", undefined, "Agency")}
        title={t("console.agency.tours.title", undefined, "Tours")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.agency.tours.subtitleTourSingular", undefined, "Tour") : t("console.agency.tours.subtitleTourPlural", undefined, "Tours")} · ${t("console.agency.tours.subtitleSuffix", undefined, "multi-date P&L roll-up")}`}
        action={
          <Button href="/studio/agency/tours/new" size="sm">
            {t("console.agency.tours.newTour", undefined, "+ New Tour")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.agency.tours.metric.totalGbor", undefined, "Total GBOR")}
            value={formatMoney(totalGBOR)}
            accent
          />
          <MetricCard
            label={t("console.agency.tours.metric.artistPayouts", undefined, "Artist Payouts")}
            value={formatMoney(totalArtist)}
          />
          <MetricCard
            label={t("console.agency.tours.metric.agentCommissions", undefined, "Agent Commissions")}
            value={formatMoney(totalCommission)}
          />
        </div>

        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/agency/tours/${r.tour_id}`}
          emptyLabel={t("console.agency.tours.empty.label", undefined, "No tours yet")}
          emptyDescription={t(
            "console.agency.tours.empty.description",
            undefined,
            "A tour groups multiple talent_offers under one container. Settlements roll up automatically.",
          )}
          emptyAction={
            <Button href="/studio/agency/tours/new" size="sm">
              {t("console.agency.tours.newTour", undefined, "+ New Tour")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.agency.tours.col.tour", undefined, "Tour"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "status",
              header: t("console.agency.tours.col.status", undefined, "Status"),
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>,
              accessor: (r) => r.status,
              filterable: true,
            },
            {
              key: "legs",
              header: t("console.agency.tours.col.legs", undefined, "Legs"),
              render: (r) => `${r.settled_legs}/${r.leg_count}`,
              accessor: (r) => Number(r.leg_count),
              mono: true,
              tabular: true,
            },
            {
              key: "gbor",
              header: t("console.agency.tours.col.gbor", undefined, "GBOR"),
              render: (r) => formatMoney(r.gross_box_office_cents),
              accessor: (r) => Number(r.gross_box_office_cents),
              mono: true,
            },
            {
              key: "nbor",
              header: t("console.agency.tours.col.nbor", undefined, "NBOR"),
              render: (r) => formatMoney(r.nbor_cents),
              accessor: (r) => Number(r.nbor_cents),
              mono: true,
            },
            {
              key: "starts",
              header: t("console.agency.tours.col.starts", undefined, "Starts"),
              render: (r) => r.starts_on ?? "—",
              accessor: (r) => r.starts_on,
              mono: true,
            },
          ]}
        />
        <div aria-hidden>{fmt.number(totalArtist)}</div>
      </div>
    </>
  );
}
