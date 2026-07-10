import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { countOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  const SECTIONS = [
    {
      href: "/studio/transport/dispatch",
      title: t("console.transport.sections.dispatch.title", undefined, "Dispatch"),
      body: t(
        "console.transport.sections.dispatch.body",
        undefined,
        "Live ground transport dispatch: runs, drivers, vehicles, ETAs.",
      ),
    },
    {
      href: "/studio/transport/ad",
      title: t("console.transport.sections.ad.title", undefined, "Arrivals & Departures"),
      body: t(
        "console.transport.sections.ad.body",
        undefined,
        "A&D manifest, airport pickups, hotel returns, VIP hand-offs.",
      ),
    },
    {
      href: "/studio/transport/workforce",
      title: t("console.transport.sections.workforce.title", undefined, "Workforce Shuttles"),
      body: t(
        "console.transport.sections.workforce.body",
        undefined,
        "Crew shuttle routes, schedules, capacity tracking.",
      ),
    },
    {
      href: "/studio/transport/fleets",
      title: t("console.transport.sections.fleets.title", undefined, "Fleets"),
      body: t(
        "console.transport.sections.fleets.body",
        undefined,
        "Vehicle inventory, certifications, fuel + mileage logs.",
      ),
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.transport.eyebrow", undefined, "Operations · Run")}
        title={t("console.transport.title", undefined, "Transport")}
        subtitle={t(
          "console.transport.subtitle",
          undefined,
          "Dispatch, arrivals & departures, workforce shuttles, fleet management.",
        )}
      />
      <div className="page-content space-y-6">
        {hasSupabase && (
          <Suspense fallback={<MetricsSkeleton />}>
            <TransportMetrics />
          </Suspense>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{s.title}</div>
              <p className="mt-2 text-xs text-[var(--p-text-2)]">{s.body}</p>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--p-accent)]">
                {t("common.open", undefined, "Open")} <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

/**
 * Streaming island — live transport counts. Dispatch + A&D are exact
 * head-counts; fleet/vehicle figures derive from the dispatch_runs roster
 * (the workforce-shuttle and fleet sub-routes are both projections of
 * dispatch_runs, so there is no separate table to count). The header and
 * the static nav tiles below paint without waiting on these queries.
 */
async function TransportMetrics() {
  const session = await requireSession();
  const supabase = await createClient();
  const [{ t }, dispatchCount, manifestCount, fleetRes] = await Promise.all([
    getRequestT(),
    countOrgScoped("dispatch_runs", session.orgId),
    countOrgScoped("ad_manifests", session.orgId),
    supabase.from("dispatch_runs").select("fleet, vehicle_ref").eq("org_id", session.orgId).limit(10_000),
  ]);
  if (fleetRes.error) throw fleetRes.error;
  const runs = fleetRes.data ?? [];
  const fleetCount = new Set(runs.map((r) => r.fleet)).size;
  const vehicleCount = new Set(runs.map((r) => r.vehicle_ref).filter((v): v is string => Boolean(v))).size;

  return (
    <div className="metric-grid">
      <MetricCard
        label={t("console.transport.metrics.dispatch", undefined, "Dispatch Runs")}
        value={dispatchCount}
        accent
      />
      <MetricCard label={t("console.transport.metrics.manifests", undefined, "A&D Manifests")} value={manifestCount} />
      <MetricCard label={t("console.transport.metrics.fleets", undefined, "Fleets")} value={fleetCount} />
      <MetricCard label={t("console.transport.metrics.vehicles", undefined, "Vehicles")} value={vehicleCount} />
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="metric-grid" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="ps-skel h-24" />
      ))}
    </div>
  );
}
