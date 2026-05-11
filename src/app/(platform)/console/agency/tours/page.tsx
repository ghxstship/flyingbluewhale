import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { formatMoney } from "@/lib/i18n/format";
import { STATUS_TONE } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

type Row = {
  id: string; // alias for tour_id to satisfy DataTable<Row extends { id: string }>
  tour_id: string;
  name: string;
  tour_phase: string;
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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Agency" title="Tours" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
        eyebrow="Agency"
        title="Tours"
        subtitle={`${rows.length} tour${rows.length === 1 ? "" : "s"} · multi-date P&L roll-up`}
        action={
          <Button href="/console/agency/tours/new" size="sm">
            + New Tour
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Total GBOR" value={formatMoney(totalGBOR)} accent />
          <MetricCard label="Artist Payouts" value={formatMoney(totalArtist)} />
          <MetricCard label="Agent Commissions" value={formatMoney(totalCommission)} />
        </div>

        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/agency/tours/${r.tour_id}`}
          emptyLabel="No tours yet"
          emptyDescription="A tour groups multiple talent_offers under one container. Settlements roll up automatically."
          emptyAction={
            <Button href="/console/agency/tours/new" size="sm">
              + New Tour
            </Button>
          }
          columns={[
            { key: "name", header: "Tour", render: (r) => r.name, accessor: (r) => r.name },
            {
              key: "tour_phase",
              header: "Phase",
              render: (r) => <Badge variant={STATUS_TONE[r.tour_phase] ?? "muted"}>{r.tour_phase}</Badge>,
              accessor: (r) => r.tour_phase,
              filterable: true,
            },
            {
              key: "legs",
              header: "Legs",
              render: (r) => `${r.settled_legs}/${r.leg_count}`,
              accessor: (r) => Number(r.leg_count),
              className: "font-mono text-xs tabular-nums",
            },
            {
              key: "gbor",
              header: "GBOR",
              render: (r) => formatMoney(r.gross_box_office_cents),
              accessor: (r) => Number(r.gross_box_office_cents),
              className: "font-mono text-xs",
            },
            {
              key: "nbor",
              header: "NBOR",
              render: (r) => formatMoney(r.nbor_cents),
              accessor: (r) => Number(r.nbor_cents),
              className: "font-mono text-xs",
            },
            {
              key: "starts",
              header: "Starts",
              render: (r) => r.starts_on ?? "—",
              accessor: (r) => r.starts_on,
              className: "font-mono text-xs",
            },
          ]}
        />
        <div aria-hidden>{fmt.number(totalArtist)}</div>
      </div>
    </>
  );
}
