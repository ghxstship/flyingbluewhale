import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { STATUS_TONE } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

type OfferRow = {
  id: string;
  performance_date: string;
  fee_cents: number;
  currency: string;
  talent_offer_phase: string;
  deposit_pct: number;
  talent_profile_id: string;
  sent_at: string | null;
  accepted_at: string | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Marketplace" title="Offers" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("talent_offers")
    .select("id, performance_date, fee_cents, currency, talent_offer_phase, deposit_pct, talent_profile_id, sent_at, accepted_at")
    .eq("org_id", session.orgId)
    .order("performance_date", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as OfferRow[];
  const live = rows.filter((r) => r.talent_offer_phase === "sent" || r.talent_offer_phase === "countered").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Marketplace"
        title="Offers"
        subtitle={`${rows.length} total · ${live} active`}
        action={
          <Button href="/console/marketplace/offers/new" size="sm">
            + New Offer
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <DataTable<OfferRow>
          rows={rows}
          rowHref={(r) => `/console/marketplace/offers/${r.id}`}
          emptyLabel="No offers yet"
          emptyDescription="An offer locks date / fee / slot / rider before contracting."
          emptyAction={
            <Button href="/console/marketplace/offers/new" size="sm">
              + New Offer
            </Button>
          }
          columns={[
            {
              key: "date",
              header: "Performance",
              render: (r) => r.performance_date,
              accessor: (r) => r.performance_date,
              className: "font-mono text-xs",
            },
            {
              key: "fee",
              header: "Fee",
              render: (r) => formatMoney(r.fee_cents),
              accessor: (r) => Number(r.fee_cents),
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
              key: "talent_offer_phase",
              header: "Phase",
              render: (r) => <Badge variant={STATUS_TONE[r.talent_offer_phase] ?? "muted"}>{r.talent_offer_phase}</Badge>,
              accessor: (r) => r.talent_offer_phase,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
