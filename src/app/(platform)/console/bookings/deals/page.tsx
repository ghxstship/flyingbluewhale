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

type DealRow = {
  id: string;
  performance_date: string;
  fee_cents: number;
  guarantee_cents: number | null;
  door_pct: number | null;
  deal_type: string;
  offer_phase: string;
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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Bookings" title="Deal Tracker" />
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
    .from("talent_offers")
    .select(
      "id, performance_date, fee_cents, guarantee_cents, door_pct, deal_type, offer_phase, deposit_pct, talent_profile_id, sent_at",
    )
    .eq("org_id", session.orgId)
    .order("performance_date", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as DealRow[];
  const live = rows.filter((r) => ["sent", "countered"].includes(r.offer_phase)).length;
  const stuck = rows.filter((r) => {
    if (r.offer_phase !== "sent" || !r.sent_at) return false;
    const ageDays = (Date.now() - new Date(r.sent_at).getTime()) / 86_400_000;
    return ageDays > 7;
  }).length;
  const totalFee = rows.reduce((s, r) => s + (r.fee_cents ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Bookings"
        title="Deal Tracker"
        subtitle={`${rows.length} deals · ${live} active · ${stuck} stuck >7d`}
        action={
          <Button href="/console/marketplace/offers/new" size="sm">
            + New Deal
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Active Deals" value={fmt.number(live)} accent />
          <MetricCard label="Stuck >7d" value={fmt.number(stuck)} />
          <MetricCard label="Total Fee Volume" value={formatMoney(totalFee)} />
        </div>

        <DataTable<DealRow>
          rows={rows}
          rowHref={(r) => `/console/bookings/deals/${r.id}`}
          emptyLabel="No deals yet"
          emptyDescription="A deal is the booking-side view of a talent_offer. Create one from /console/marketplace/offers/new."
          columns={[
            {
              key: "date",
              header: "Performance",
              render: (r) => r.performance_date,
              accessor: (r) => r.performance_date,
              className: "font-mono text-xs",
            },
            {
              key: "type",
              header: "Deal Type",
              render: (r) => <Badge variant="muted">{r.deal_type}</Badge>,
              accessor: (r) => r.deal_type,
              filterable: true,
              groupable: true,
            },
            {
              key: "fee",
              header: "Fee / Guar",
              render: (r) => formatMoney(r.guarantee_cents ?? r.fee_cents),
              accessor: (r) => Number(r.guarantee_cents ?? r.fee_cents),
              className: "font-mono text-xs",
            },
            {
              key: "door",
              header: "Door %",
              render: (r) => (r.door_pct == null ? "—" : `${r.door_pct}%`),
              accessor: (r) => Number(r.door_pct ?? 0),
              className: "font-mono text-xs",
            },
            {
              key: "deposit",
              header: "Deposit",
              render: (r) => `${r.deposit_pct}%`,
              accessor: (r) => Number(r.deposit_pct ?? 0),
              className: "font-mono text-xs",
            },
            {
              key: "stage",
              header: "Stage",
              render: (r) => (
                <Badge variant={STATUS_TONE[r.offer_phase] ?? "muted"}>{STAGE_BUCKETS[r.offer_phase] ?? r.offer_phase}</Badge>
              ),
              accessor: (r) => r.offer_phase,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
