import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.agency.eyebrow", undefined, "Agency")}
          title={t("console.agency.title", undefined, "Overview")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.agency.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
    supabase.from("tours").select("id, status").eq("org_id", session.orgId).is("deleted_at", null),
  ]);
  const agencyCount = (agencies.data ?? []).length;
  const rosterCount = (roster.data ?? []).length;
  const tourRows = (tours.data ?? []) as Array<{ status: string }>;
  const activeTours = tourRows.filter((r) => ["routing", "confirmed"].includes(r.status)).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.agency.eyebrow", undefined, "Agency")}
        title={t("console.agency.title", undefined, "Overview")}
        subtitle={t("console.agency.subtitle", undefined, "Roster + tours + commission tracking.")}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.agency.metrics.agencies", undefined, "Agencies")}
            value={fmt.number(agencyCount)}
          />
          <MetricCard
            label={t("console.agency.metrics.activeRoster", undefined, "Active Roster")}
            value={fmt.number(rosterCount)}
            accent
          />
          <MetricCard
            label={t("console.agency.metrics.activeTours", undefined, "Active Tours")}
            value={fmt.number(activeTours)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Link href="/console/agency/roster" className="surface p-5">
            <div className="text-sm font-semibold tracking-wide uppercase">
              {t("console.agency.cards.roster.title", undefined, "Roster")}
            </div>
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "console.agency.cards.roster.description",
                undefined,
                "Active artist roster, commission %, agent assignments.",
              )}
            </p>
          </Link>
          <Link href="/console/agency/tours" className="surface p-5">
            <div className="text-sm font-semibold tracking-wide uppercase">
              {t("console.agency.cards.tours.title", undefined, "Tours")}
            </div>
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t("console.agency.cards.tours.description", undefined, "Multi-date P&L roll-up across linked deals.")}
            </p>
          </Link>
          <Link href="/console/agency/commissions" className="surface p-5">
            <div className="text-sm font-semibold tracking-wide uppercase">
              {t("console.agency.cards.commissions.title", undefined, "Commissions")}
            </div>
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t("console.agency.cards.commissions.description", undefined, "Per-period commission report.")}
            </p>
          </Link>
        </div>

        <Button href="/console/agency/tours/new" size="sm">
          {t("console.agency.newTour", undefined, "+ New Tour")}
        </Button>
      </div>
    </>
  );
}
