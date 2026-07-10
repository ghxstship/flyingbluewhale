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
import { DAY_SHEET_STATE_LABELS, DAY_SHEET_STATE_TONE, type DaySheetState } from "@/lib/db/day-sheets";
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
  talent_offer_state: string;
  tour_leg_index: number | null;
};

type DaySheet = {
  id: string;
  city: string | null;
  venue: string | null;
  sheet_date: string | null;
  sheet_state: DaySheetState;
};

export default async function Page({ params }: { params: Promise<{ tourId: string }> }) {
  const { tourId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const [pnlResp, legsResp, sheetsResp] = await Promise.all([
    supabase.from("tour_p_and_l").select("*").eq("tour_id", tourId).eq("org_id", session.orgId).maybeSingle(),
    supabase
      .from("talent_offers")
      .select("id, performance_date, fee_cents, talent_offer_state, tour_leg_index")
      .eq("tour_id", tourId)
      .eq("org_id", session.orgId)
      .order("performance_date", { ascending: true }),
    supabase
      .from("day_sheets")
      .select("id, city, venue, sheet_date, sheet_state")
      .eq("tour_id", tourId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("sheet_date", { ascending: true, nullsFirst: false }),
  ]);
  if (!pnlResp.data) return notFound();
  const pnl = pnlResp.data as PnL;
  const legs = (legsResp.data ?? []) as Leg[];
  const sheets = (sheetsResp.data ?? []) as DaySheet[];

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
                href={`/studio/marketplace/offers?tour=${pnl.tour_id}`}
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
                    <Badge variant={STATUS_TONE[l.talent_offer_state] ?? "muted"}>
                      {toTitle(l.talent_offer_state)}
                    </Badge>
                    <Link href={`/studio/bookings/deals/${l.id}`} className="text-xs text-[var(--brand-color)]">
                      {t("console.agency.tours.detail.legs.open", undefined, "Open →")}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.agency.tours.detail.daySheets.heading", undefined, "Day Sheets")}
            </h2>
            <Link
              href="/studio/operations/day-sheets/new"
              className="text-xs text-[var(--brand-color)] underline-offset-2 hover:underline"
            >
              {t("console.agency.tours.detail.daySheets.new", undefined, "New Day Sheet →")}
            </Link>
          </div>
          {sheets.length === 0 ? (
            <p className="text-sm text-[var(--p-text-2)]">
              {t(
                "console.agency.tours.detail.daySheets.empty",
                undefined,
                "No day sheets yet. Compose one per date and publish it to the field crew.",
              )}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border-subtle)]">
              {sheets.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[var(--p-text-2)]">{s.sheet_date ?? "—"}</span>
                    <span>{[s.city, s.venue].filter(Boolean).join(" · ") || "—"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={DAY_SHEET_STATE_TONE[s.sheet_state]}>{DAY_SHEET_STATE_LABELS[s.sheet_state]}</Badge>
                    <Link href={`/studio/operations/day-sheets/${s.id}`} className="text-xs text-[var(--brand-color)]">
                      {t("console.agency.tours.detail.daySheets.open", undefined, "Open →")}
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
