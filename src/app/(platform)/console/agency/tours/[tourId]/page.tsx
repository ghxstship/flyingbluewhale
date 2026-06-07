import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { STATUS_TONE } from "@/lib/marketplace";
import { getRequestT } from "@/lib/i18n/request";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PnL = {
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

type Leg = {
  id: string;
  performance_date: string;
  fee_cents: number;
  status: string;
  tour_leg_index: number | null;
};

export default async function Page({ params }: { params: Promise<{ tourId: string }> }) {
  const { tourId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const [pnlResp, legsResp] = await Promise.all([
    supabase.from("tour_p_and_l").select("*").eq("tour_id", tourId).eq("org_id", session.orgId).maybeSingle(),
    supabase
      .from("talent_offers")
      .select("id, performance_date, fee_cents, status, tour_leg_index")
      .eq("tour_id", tourId)
      .eq("org_id", session.orgId)
      .order("performance_date", { ascending: true }),
  ]);
  if (!pnlResp.data) return notFound();
  const pnl = pnlResp.data as PnL;
  const legs = (legsResp.data ?? []) as Leg[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.agency.tours.detail.eyebrow", undefined, "Agency · Tour")}
        title={pnl.name}
        subtitle={t(
          "console.agency.tours.detail.subtitle",
          { starts: pnl.starts_on ?? "—", ends: pnl.ends_on ?? "—", count: pnl.leg_count },
          `${pnl.starts_on ?? "—"} → ${pnl.ends_on ?? "—"} · ${pnl.leg_count} legs`,
        )}
        action={<Badge variant={STATUS_TONE[pnl.status] ?? "muted"}>{toTitle(pnl.status)}</Badge>}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard
            label={t("console.agency.tours.detail.metrics.gbor", undefined, "GBOR")}
            value={formatMoney(pnl.gross_box_office_cents)}
            accent
          />
          <MetricCard
            label={t("console.agency.tours.detail.metrics.nbor", undefined, "NBOR")}
            value={formatMoney(pnl.nbor_cents)}
          />
          <MetricCard
            label={t("console.agency.tours.detail.metrics.artistPayout", undefined, "Artist Payout")}
            value={formatMoney(pnl.artist_payout_cents)}
          />
          <MetricCard
            label={t("console.agency.tours.detail.metrics.ancillary", undefined, "Ancillary")}
            value={formatMoney(pnl.ancillary_revenue_cents)}
          />
        </div>

        <section className="surface p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
            {t("console.agency.tours.detail.legs.heading", undefined, "Legs")}
          </h2>
          {legs.length === 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--p-text-2)]">
              <span>
                {t(
                  "console.agency.tours.detail.legs.empty",
                  undefined,
                  "No legs linked yet. Each performance offer is a leg.",
                )}
              </span>
              <Link
                href={`/console/marketplace/offers?tour=${pnl.tour_id}`}
                className="text-xs text-[var(--brand-color)] underline-offset-2 hover:underline"
              >
                {t("console.agency.tours.detail.legs.linkOffer", undefined, "Link An Offer →")}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border-subtle)]">
              {legs.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs">#{l.tour_leg_index ?? "?"}</span>
                    <span>{l.performance_date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs">{formatMoney(l.fee_cents)}</span>
                    <Badge variant={STATUS_TONE[l.status] ?? "muted"}>{toTitle(l.status)}</Badge>
                    <Link href={`/console/bookings/deals/${l.id}`} className="text-xs text-[var(--brand-color)]">
                      {t("console.agency.tours.detail.legs.open", undefined, "Open →")}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
