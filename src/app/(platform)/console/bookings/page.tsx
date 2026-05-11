import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { formatMoney } from "@/lib/i18n/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Bookings" title="Overview" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const [offers, holds, settlements] = await Promise.all([
    supabase.from("talent_offers").select("id, talent_offer_phase, fee_cents").eq("org_id", session.orgId),
    supabase.from("availability_slots").select("id, kind, tier").eq("kind", "hold"),
    supabase
      .from("settlements")
      .select("id, settlement_phase, gross_box_office_cents, balance_due_cents")
      .eq("org_id", session.orgId),
  ]);

  const offerRows = (offers.data ?? []) as Array<{ talent_offer_phase: string; fee_cents: number }>;
  const holdRows = (holds.data ?? []) as Array<{ tier: number }>;
  const settlementRows = (settlements.data ?? []) as Array<{
    settlement_phase: string;
    gross_box_office_cents: number;
    balance_due_cents: number;
  }>;

  const liveDeals = offerRows.filter((r) => ["sent", "countered"].includes(r.talent_offer_phase)).length;
  const accepted = offerRows.filter((r) => ["accepted", "contracted"].includes(r.talent_offer_phase)).length;
  const tier1 = holdRows.filter((r) => r.tier === 1).length;
  const finalized = settlementRows.filter((r) => r.settlement_phase === "final").length;
  const grossBO = settlementRows.reduce((s, r) => s + (r.gross_box_office_cents ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Bookings"
        title="Overview"
        subtitle="Show economy: deals, holds, settlement, tours, marketing, insights."
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard label="Live Deals" value={fmt.number(liveDeals)} accent />
          <MetricCard label="Accepted" value={fmt.number(accepted)} />
          <MetricCard label="Tier-1 Holds" value={fmt.number(tier1)} />
          <MetricCard label="Settled GBOR" value={formatMoney(grossBO)} />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Tile
            href="/console/bookings/deals"
            newHref="/console/marketplace/offers/new"
            title="Deal Tracker"
            blurb="Pipeline view of every deal — draft, sent, countered, accepted, contracted."
          />
          <Tile
            href="/console/bookings/holds"
            newHref="/console/bookings/holds/new"
            title="Holds"
            blurb="Multi-tier hold calendar. Releasing a higher tier auto-promotes the next."
          />
          <Tile
            href="/console/bookings/calendar"
            title="Calendar"
            blurb="Holds + confirms + marketing milestones in one view."
          />
          <Tile
            href="/console/bookings/settlements"
            title="Settlements"
            blurb={`${fmt.number(finalized)} finalized · NBOR auto-computed.`}
          />
          <Tile href="/console/agency/tours" title="Tours" blurb="Tour P&L roll-up across linked offers." />
          <Tile href="/console/marketing" title="Marketing" blurb="Announce, presale, on-sale dates per show." />
          <Tile href="/console/insights" title="Insights" blurb="Anonymized booking pool — opt-in only, k≥3 floor." />
          <Tile
            href="/console/settings/integrations/ticketing"
            title="Ticketing"
            blurb="Etix / DICE / Tixr / Eventbrite / SeeTickets / AXS."
          />
        </div>
      </div>
    </>
  );
}

function Tile({ href, title, blurb, newHref }: { href: string; title: string; blurb: string; newHref?: string }) {
  return (
    <div className="surface flex flex-col gap-2 p-5">
      <div className="flex items-start justify-between gap-2">
        <Link href={href} className="text-sm font-semibold tracking-wide uppercase">
          {title}
        </Link>
        {newHref && (
          <Button size="sm" variant="ghost" href={newHref}>
            +
          </Button>
        )}
      </div>
      <p className="text-xs text-[var(--text-secondary)]">{blurb}</p>
    </div>
  );
}
