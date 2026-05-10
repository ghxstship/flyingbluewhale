import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  show_date: string;
  agent_commission_cents: number;
  artist_payout_cents: number;
  status: string;
  talent_offer_id: string | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Agency" title="Commissions" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("settlements")
    .select("id, show_date, agent_commission_cents, artist_payout_cents, status, talent_offer_id")
    .eq("org_id", session.orgId)
    .gt("agent_commission_cents", 0)
    .order("show_date", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as Row[];
  const total = rows.reduce((s, r) => s + (r.agent_commission_cents ?? 0), 0);
  const finalized = rows.filter((r) => r.status === "final").reduce((s, r) => s + r.agent_commission_cents, 0);

  return (
    <>
      <ModuleHeader eyebrow="Agency" title="Commissions" subtitle={`${rows.length} settlements with commission`} />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Total Booked" value={formatMoney(total)} accent />
          <MetricCard label="Finalized" value={formatMoney(finalized)} />
          <MetricCard label="Pending" value={formatMoney(total - finalized)} />
        </div>

        <DataTable<Row>
          rows={rows}
          rowHref={(r) =>
            r.talent_offer_id
              ? `/console/bookings/deals/${r.talent_offer_id}/settlement`
              : `/console/bookings/settlements/${r.id}`
          }
          emptyLabel="No commissions tracked yet"
          emptyDescription="Settlements with non-zero agent_commission_cents appear here."
          columns={[
            {
              key: "date",
              header: "Show",
              render: (r) => r.show_date,
              accessor: (r) => r.show_date,
              className: "font-mono text-xs",
            },
            {
              key: "comm",
              header: "Commission",
              render: (r) => formatMoney(r.agent_commission_cents),
              accessor: (r) => Number(r.agent_commission_cents),
              className: "font-mono text-xs",
            },
            {
              key: "artist",
              header: "Artist Payout",
              render: (r) => formatMoney(r.artist_payout_cents),
              accessor: (r) => Number(r.artist_payout_cents),
              className: "font-mono text-xs",
            },
            { key: "status", header: "Status", render: (r) => r.status, accessor: (r) => r.status, filterable: true },
          ]}
        />
      </div>
    </>
  );
}
