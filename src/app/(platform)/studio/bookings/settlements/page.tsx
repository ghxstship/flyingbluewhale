import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { formatMoney } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { STATUS_TONE } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  show_date: string;
  settlement_state: string;
  gross_box_office_cents: number;
  nbor_cents: number;
  artist_payout_cents: number;
  balance_due_cents: number;
  paid_attendance: number;
  finalized_at: string | null;
  talent_offer_id: string | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.bookings.settlements.eyebrow", undefined, "Bookings")}
          title={t("console.bookings.settlements.title", undefined, "Settlements")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.bookings.settlements.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("settlements")
    .select(
      "id, show_date, settlement_state, gross_box_office_cents, nbor_cents, artist_payout_cents, balance_due_cents, paid_attendance, finalized_at, talent_offer_id",
    )
    .eq("org_id", session.orgId)
    .order("show_date", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as Row[];
  const finalCount = rows.filter((r) => r.settlement_state === "final").length;
  const draftCount = rows.filter((r) => r.settlement_state === "draft").length;
  const totalGBOR = rows.reduce((s, r) => s + (r.gross_box_office_cents ?? 0), 0);
  const totalNBOR = rows.reduce((s, r) => s + (r.nbor_cents ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.bookings.settlements.eyebrow", undefined, "Bookings")}
        title={t("console.bookings.settlements.title", undefined, "Settlements")}
        subtitle={t(
          "console.bookings.settlements.subtitle",
          { total: rows.length, final: finalCount, draft: draftCount },
          `${rows.length} Settlements · ${finalCount} Final · ${draftCount} Draft`,
        )}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard
            label={t("console.bookings.settlements.metric.totalGbor", undefined, "Total GBOR")}
            value={formatMoney(totalGBOR)}
            accent
          />
          <MetricCard
            label={t("console.bookings.settlements.metric.totalNbor", undefined, "Total NBOR")}
            value={formatMoney(totalNBOR)}
          />
          <MetricCard
            label={t("console.bookings.settlements.metric.final", undefined, "Final")}
            value={fmt.number(finalCount)}
          />
          <MetricCard
            label={t("console.bookings.settlements.metric.draft", undefined, "Draft")}
            value={fmt.number(draftCount)}
          />
        </div>

        <DataView<Row>
          rows={rows}
          rowHref={(r) =>
            r.talent_offer_id
              ? `/studio/bookings/deals/${r.talent_offer_id}/settlement`
              : `/studio/bookings/settlements/${r.id}`
          }
          emptyLabel={t("console.bookings.settlements.emptyLabel", undefined, "No settlements yet")}
          emptyDescription={t(
            "console.bookings.settlements.emptyDescription",
            undefined,
            "Settlements are created from accepted deals on the deal detail page.",
          )}
          columns={[
            {
              key: "date",
              header: t("console.bookings.settlements.col.showDate", undefined, "Show Date"),
              render: (r) => r.show_date,
              accessor: (r) => r.show_date,
              mono: true,
            },
            {
              key: "gbor",
              header: t("console.bookings.settlements.col.gbor", undefined, "GBOR"),
              render: (r) => formatMoney(r.gross_box_office_cents),
              accessor: (r) => Number(r.gross_box_office_cents),
              mono: true,
            },
            {
              key: "nbor",
              header: t("console.bookings.settlements.col.nbor", undefined, "NBOR"),
              render: (r) => formatMoney(r.nbor_cents),
              accessor: (r) => Number(r.nbor_cents),
              mono: true,
            },
            {
              key: "artist",
              header: t("console.bookings.settlements.col.artistPayout", undefined, "Artist Payout"),
              render: (r) => formatMoney(r.artist_payout_cents),
              accessor: (r) => Number(r.artist_payout_cents),
              mono: true,
            },
            {
              key: "balance",
              header: t("console.bookings.settlements.col.balanceDue", undefined, "Balance Due"),
              render: (r) => formatMoney(r.balance_due_cents),
              accessor: (r) => Number(r.balance_due_cents),
              mono: true,
            },
            {
              key: "att",
              header: t("console.bookings.settlements.col.paidAtt", undefined, "Paid Att."),
              render: (r) => fmt.number(r.paid_attendance ?? 0),
              accessor: (r) => Number(r.paid_attendance ?? 0),
              mono: true,
              tabular: true,
            },
            {
              key: "settlement_state",
              header: t("console.bookings.settlements.col.settlement_state", undefined, "Status"),
              render: (r) => (
                <Badge variant={STATUS_TONE[r.settlement_state] ?? "muted"}>{toTitle(r.settlement_state)}</Badge>
              ),
              accessor: (r) => r.settlement_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
