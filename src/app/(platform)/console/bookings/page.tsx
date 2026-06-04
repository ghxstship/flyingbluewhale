import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { formatMoney } from "@/lib/i18n/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.bookings.eyebrow", undefined, "Bookings")}
          title={t("console.bookings.overview.title", undefined, "Overview")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.bookings.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const [offers, holds, settlements] = await Promise.all([
    supabase.from("talent_offers").select("id, status, fee_cents").eq("org_id", session.orgId),
    supabase.from("availability_slots").select("id, kind, tier").eq("kind", "hold"),
    supabase
      .from("settlements")
      .select("id, status, gross_box_office_cents, balance_due_cents")
      .eq("org_id", session.orgId),
  ]);

  const offerRows = (offers.data ?? []) as Array<{ status: string; fee_cents: number }>;
  const holdRows = (holds.data ?? []) as Array<{ tier: number }>;
  const settlementRows = (settlements.data ?? []) as Array<{
    status: string;
    gross_box_office_cents: number;
    balance_due_cents: number;
  }>;

  const liveDeals = offerRows.filter((r) => ["sent", "countered"].includes(r.status)).length;
  const accepted = offerRows.filter((r) => ["accepted", "contracted"].includes(r.status)).length;
  const tier1 = holdRows.filter((r) => r.tier === 1).length;
  const finalized = settlementRows.filter((r) => r.status === "final").length;
  const grossBO = settlementRows.reduce((s, r) => s + (r.gross_box_office_cents ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.bookings.eyebrow", undefined, "Bookings")}
        title={t("console.bookings.overview.title", undefined, "Overview")}
        subtitle={t("console.bookings.overview.subtitle", undefined, "Deals, holds, settlements, tours.")}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard
            label={t("console.bookings.metrics.liveDeals", undefined, "Live Deals")}
            value={fmt.number(liveDeals)}
            accent
          />
          <MetricCard
            label={t("console.bookings.metrics.accepted", undefined, "Accepted")}
            value={fmt.number(accepted)}
          />
          <MetricCard
            label={t("console.bookings.metrics.tier1Holds", undefined, "Tier-1 Holds")}
            value={fmt.number(tier1)}
          />
          <MetricCard
            label={t("console.bookings.metrics.settledGbor", undefined, "Settled GBOR")}
            value={formatMoney(grossBO)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Tile
            href="/console/bookings/deals"
            newHref="/console/marketplace/offers/new"
            title={t("console.bookings.tiles.deals.title", undefined, "Deal Tracker")}
            blurb={t(
              "console.bookings.tiles.deals.blurb",
              undefined,
              "Pipeline view of every deal — draft, sent, countered, accepted, contracted.",
            )}
          />
          <Tile
            href="/console/bookings/holds"
            newHref="/console/bookings/holds/new"
            title={t("console.bookings.tiles.holds.title", undefined, "Holds")}
            blurb={t(
              "console.bookings.tiles.holds.blurb",
              undefined,
              "Multi-tier hold calendar. Releasing a higher tier auto-promotes the next.",
            )}
          />
          <Tile
            href="/console/bookings/calendar"
            title={t("console.bookings.tiles.calendar.title", undefined, "Calendar")}
            blurb={t(
              "console.bookings.tiles.calendar.blurb",
              undefined,
              "Holds + confirms + marketing milestones in one view.",
            )}
          />
          <Tile
            href="/console/bookings/settlements"
            title={t("console.bookings.tiles.settlements.title", undefined, "Settlements")}
            blurb={t(
              "console.bookings.tiles.settlements.blurb",
              { count: fmt.number(finalized) },
              `${fmt.number(finalized)} finalized · NBOR auto-computed.`,
            )}
          />
          <Tile
            href="/console/agency/tours"
            title={t("console.bookings.tiles.tours.title", undefined, "Tours")}
            blurb={t("console.bookings.tiles.tours.blurb", undefined, "Tour P&L roll-up across linked offers.")}
          />
          <Tile
            href="/console/marketing"
            title={t("console.bookings.tiles.marketing.title", undefined, "Marketing")}
            blurb={t("console.bookings.tiles.marketing.blurb", undefined, "Announce, presale, on-sale dates per show.")}
          />
          <Tile
            href="/console/insights"
            title={t("console.bookings.tiles.insights.title", undefined, "Insights")}
            blurb={t(
              "console.bookings.tiles.insights.blurb",
              undefined,
              "Anonymized booking pool — opt-in only, k≥3 floor.",
            )}
          />
          <Tile
            href="/console/settings/integrations/ticketing"
            title={t("console.bookings.tiles.ticketing.title", undefined, "Ticketing")}
            blurb={t(
              "console.bookings.tiles.ticketing.blurb",
              undefined,
              "Etix / DICE / Tixr / Eventbrite / SeeTickets / AXS.",
            )}
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
