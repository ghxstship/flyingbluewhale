import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const HUB_TILES: Array<{ href: string; label: string; description: string }> = [
  { href: "/console/production/equipment", label: "Equipment", description: "Asset register · 5-state lifecycle" },
  { href: "/console/production/rentals", label: "Rentals", description: "Booking + handover ledger" },
  { href: "/console/production/rentals/availability", label: "Availability", description: "7-day matrix" },
  { href: "/m/wms", label: "Mobile Scan", description: "Pick / put-away on COMPVSS" },
  { href: "/console/logistics/disposition", label: "Disposition", description: "Retired + maintenance" },
  { href: "/console/logistics/services", label: "Services", description: "Waste + cleaning requests" },
];

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Logistics" title="Warehouse" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const [{ count: assetCount }, { data: statusData }, { count: locationCount }, { count: maintenanceCount }] =
    await Promise.all([
      supabase.from("equipment").select("*", { count: "exact", head: true }).eq("org_id", session.orgId),
      supabase.from("equipment").select("status").eq("org_id", session.orgId).limit(2000),
      supabase.from("locations").select("*", { count: "exact", head: true }).eq("org_id", session.orgId),
      supabase
        .from("equipment")
        .select("*", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .eq("status", "maintenance"),
    ]);

  const buckets = ((statusData ?? []) as Array<{ status: string }>).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <ModuleHeader
        eyebrow="Logistics"
        title="Warehouse"
        subtitle="FF&E + central + venue warehousing"
        action={
          <Button href="/m/wms" size="sm">
            Mobile scan
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Assets" value={fmt.number(assetCount ?? 0)} accent />
          <MetricCard label="Locations" value={fmt.number(locationCount ?? 0)} />
          <MetricCard label="In Maintenance" value={fmt.number(maintenanceCount ?? 0)} />
        </div>

        {Object.keys(buckets).length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">By Status</h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-3">
              {Object.entries(buckets)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <li key={status} className="flex items-center justify-between text-sm">
                    <Badge variant="muted">{status}</Badge>
                    <span className="font-mono text-xs text-[var(--text-muted)]">{fmt.number(count)}</span>
                  </li>
                ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="text-sm font-semibold">Drill In</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {HUB_TILES.map((t) => (
              <Link key={t.href} href={t.href} className="surface hover-lift p-4">
                <div className="text-sm font-medium">{t.label}</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">{t.description}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
