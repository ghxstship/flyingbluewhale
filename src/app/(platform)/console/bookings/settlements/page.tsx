import { ModuleHeader } from "@/components/Shell";
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
  id: string;
  show_date: string;
  status: string;
  gross_box_office_cents: number;
  nbor_cents: number;
  artist_payout_cents: number;
  balance_due_cents: number;
  paid_attendance: number;
  finalized_at: string | null;
  talent_offer_id: string | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Bookings" title="Settlements" />
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
    .from("settlements")
    .select(
      "id, show_date, status, gross_box_office_cents, nbor_cents, artist_payout_cents, balance_due_cents, paid_attendance, finalized_at, talent_offer_id",
    )
    .eq("org_id", session.orgId)
    .order("show_date", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as Row[];
  const finalCount = rows.filter((r) => r.status === "final").length;
  const draftCount = rows.filter((r) => r.status === "draft").length;
  const totalGBOR = rows.reduce((s, r) => s + (r.gross_box_office_cents ?? 0), 0);
  const totalNBOR = rows.reduce((s, r) => s + (r.nbor_cents ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Bookings"
        title="Settlements"
        subtitle={`${rows.length} settlements · ${finalCount} final · ${draftCount} draft`}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard label="Total GBOR" value={formatMoney(totalGBOR)} accent />
          <MetricCard label="Total NBOR" value={formatMoney(totalNBOR)} />
          <MetricCard label="Final" value={fmt.number(finalCount)} />
          <MetricCard label="Draft" value={fmt.number(draftCount)} />
        </div>

        <DataTable<Row>
          rows={rows}
          rowHref={(r) =>
            r.talent_offer_id
              ? `/console/bookings/deals/${r.talent_offer_id}/settlement`
              : `/console/bookings/settlements/${r.id}`
          }
          emptyLabel="No settlements yet"
          emptyDescription="Settlements are created from accepted deals on the deal detail page."
          columns={[
            {
              key: "date",
              header: "Show Date",
              render: (r) => r.show_date,
              accessor: (r) => r.show_date,
              className: "font-mono text-xs",
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
              key: "artist",
              header: "Artist Payout",
              render: (r) => formatMoney(r.artist_payout_cents),
              accessor: (r) => Number(r.artist_payout_cents),
              className: "font-mono text-xs",
            },
            {
              key: "balance",
              header: "Balance Due",
              render: (r) => formatMoney(r.balance_due_cents),
              accessor: (r) => Number(r.balance_due_cents),
              className: "font-mono text-xs",
            },
            {
              key: "att",
              header: "Paid Att.",
              render: (r) => fmt.number(r.paid_attendance ?? 0),
              accessor: (r) => Number(r.paid_attendance ?? 0),
              className: "font-mono text-xs tabular-nums",
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status}</Badge>,
              accessor: (r) => r.status,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
