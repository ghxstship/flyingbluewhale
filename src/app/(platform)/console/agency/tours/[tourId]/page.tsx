import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/i18n/format";
import { STATUS_TONE } from "@/lib/marketplace";
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
        eyebrow="Agency · Tour"
        title={pnl.name}
        subtitle={`${pnl.starts_on ?? "—"} → ${pnl.ends_on ?? "—"} · ${pnl.leg_count} legs`}
        action={<Badge variant={STATUS_TONE[pnl.status] ?? "muted"}>{pnl.status}</Badge>}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard label="GBOR" value={formatMoney(pnl.gross_box_office_cents)} accent />
          <MetricCard label="NBOR" value={formatMoney(pnl.nbor_cents)} />
          <MetricCard label="Artist Payout" value={formatMoney(pnl.artist_payout_cents)} />
          <MetricCard label="Ancillary" value={formatMoney(pnl.ancillary_revenue_cents)} />
        </div>

        <section className="surface p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">Legs</h2>
          {legs.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              No legs linked yet. Set <code className="font-mono">tour_id</code> on the talent_offer to link.
            </p>
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
                    <Badge variant={STATUS_TONE[l.status] ?? "muted"}>{l.status}</Badge>
                    <Link href={`/console/bookings/deals/${l.id}`} className="text-xs text-[var(--org-primary)]">
                      Open →
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
