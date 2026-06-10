import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  show_date: string;
  agent_commission_cents: number;
  artist_payout_cents: number;
  settlement_state: string;
  talent_offer_id: string | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.agency.commissions.eyebrow", undefined, "Agency")}
          title={t("console.agency.commissions.title", undefined, "Commissions")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.agency.commissions.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("settlements")
    .select("id, show_date, agent_commission_cents, artist_payout_cents, settlement_state, talent_offer_id")
    .eq("org_id", session.orgId)
    .gt("agent_commission_cents", 0)
    .order("show_date", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as Row[];
  const total = rows.reduce((s, r) => s + (r.agent_commission_cents ?? 0), 0);
  const finalized = rows
    .filter((r) => r.settlement_state === "final")
    .reduce((s, r) => s + r.agent_commission_cents, 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.agency.commissions.eyebrow", undefined, "Agency")}
        title={t("console.agency.commissions.title", undefined, "Commissions")}
        subtitle={t(
          "console.agency.commissions.subtitle",
          { count: rows.length },
          `${rows.length} Settlements with commission`,
        )}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.agency.commissions.totalBooked", undefined, "Total Booked")}
            value={formatMoney(total)}
            accent
          />
          <MetricCard
            label={t("console.agency.commissions.finalized", undefined, "Finalized")}
            value={formatMoney(finalized)}
          />
          <MetricCard
            label={t("console.agency.commissions.pending", undefined, "Pending")}
            value={formatMoney(total - finalized)}
          />
        </div>

        <DataTable<Row>
          rows={rows}
          rowHref={(r) =>
            r.talent_offer_id
              ? `/console/bookings/deals/${r.talent_offer_id}/settlement`
              : `/console/bookings/settlements/${r.id}`
          }
          emptyLabel={t("console.agency.commissions.emptyLabel", undefined, "No commissions tracked yet")}
          emptyDescription={t(
            "console.agency.commissions.emptyDescription",
            undefined,
            "Settlements with non-zero agent_commission_cents appear here.",
          )}
          columns={[
            {
              key: "date",
              header: t("console.agency.commissions.col.show", undefined, "Show"),
              render: (r) => r.show_date,
              accessor: (r) => r.show_date,
              className: "font-mono text-xs",
            },
            {
              key: "comm",
              header: t("console.agency.commissions.col.commission", undefined, "Commission"),
              render: (r) => formatMoney(r.agent_commission_cents),
              accessor: (r) => Number(r.agent_commission_cents),
              className: "font-mono text-xs",
            },
            {
              key: "artist",
              header: t("console.agency.commissions.col.artistPayout", undefined, "Artist Payout"),
              render: (r) => formatMoney(r.artist_payout_cents),
              accessor: (r) => Number(r.artist_payout_cents),
              className: "font-mono text-xs",
            },
            {
              key: "settlement_state",
              header: t("console.agency.commissions.col.settlement_state", undefined, "Status"),
              render: (r) => r.settlement_state,
              accessor: (r) => r.settlement_state,
              filterable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
