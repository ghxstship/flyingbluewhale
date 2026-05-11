import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Agency" title="Overview" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const [agencies, roster, tours] = await Promise.all([
    supabase.from("agencies").select("id").eq("org_id", session.orgId).is("deleted_at", null),
    supabase.from("agency_artists").select("id").eq("org_id", session.orgId).is("ended_at", null),
    supabase.from("tours").select("id, tour_phase").eq("org_id", session.orgId).is("deleted_at", null),
  ]);
  const agencyCount = (agencies.data ?? []).length;
  const rosterCount = (roster.data ?? []).length;
  const tourRows = (tours.data ?? []) as Array<{ tour_phase: string }>;
  const activeTours = tourRows.filter((r) => ["routing", "confirmed"].includes(r.tour_phase)).length;

  return (
    <>
      <ModuleHeader eyebrow="Agency" title="Overview" subtitle="Roster + tours + commission tracking." />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Agencies" value={fmt.number(agencyCount)} />
          <MetricCard label="Active Roster" value={fmt.number(rosterCount)} accent />
          <MetricCard label="Active Tours" value={fmt.number(activeTours)} />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Link href="/console/agency/roster" className="surface p-5">
            <div className="text-sm font-semibold tracking-wide uppercase">Roster</div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              Active artist roster, commission %, agent assignments.
            </p>
          </Link>
          <Link href="/console/agency/tours" className="surface p-5">
            <div className="text-sm font-semibold tracking-wide uppercase">Tours</div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">Multi-date P&L roll-up across linked deals.</p>
          </Link>
          <Link href="/console/agency/commissions" className="surface p-5">
            <div className="text-sm font-semibold tracking-wide uppercase">Commissions</div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">Per-period commission report.</p>
          </Link>
        </div>

        <Button href="/console/agency/tours/new" size="sm">
          + New Tour
        </Button>
      </div>
    </>
  );
}
