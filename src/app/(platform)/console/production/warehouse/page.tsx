import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

const HUB_TILES: Array<{ href: string; label: string; description: string }> = [
  {
    href: "/console/production/warehouse/inventory",
    label: "Inventory",
    description: "Every asset across all locations",
  },
  {
    href: "/console/production/warehouse/locations",
    label: "Locations",
    description: "Bins, bays, depots, venue back-of-house",
  },
  { href: "/console/production/equipment", label: "Equipment", description: "Asset register · 5-state lifecycle" },
  { href: "/console/production/rentals", label: "Rentals", description: "Bookings + handover tracking" },
  { href: "/console/production/rentals/availability", label: "Availability", description: "7-day matrix" },
  { href: "/m/inventory/scan", label: "Mobile scan", description: "Receive / put-away / pick" },
];

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Production" title="Warehouse" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const [{ count: assetCount }, { count: locationCount }, { data: rentalsData }, { data: equipmentByStatus }] =
    await Promise.all([
      supabase
        .from("equipment")
        .select("*", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .is("deleted_at", null),
      supabase.from("locations").select("*", { count: "exact", head: true }).eq("org_id", session.orgId),
      supabase
        .from("rentals")
        .select("id, ends_at")
        .eq("org_id", session.orgId)
        .gte("ends_at", new Date().toISOString())
        .limit(500),
      supabase.from("equipment").select("status").eq("org_id", session.orgId).is("deleted_at", null).limit(2000),
    ]);

  const activeRentals = (rentalsData ?? []).length;
  const statusBuckets = ((equipmentByStatus ?? []) as Array<{ status: string }>).reduce<Record<string, number>>(
    (acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <>
      <ModuleHeader eyebrow="Production" title="Warehouse" subtitle="Central + venue warehousing hub" />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Assets" value={(assetCount ?? 0).toLocaleString()} accent />
          <MetricCard label="Locations" value={(locationCount ?? 0).toLocaleString()} />
          <MetricCard label="Active rentals" value={activeRentals.toLocaleString()} />
        </div>

        {Object.keys(statusBuckets).length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">By status</h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-3">
              {Object.entries(statusBuckets)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <li key={status} className="flex items-center justify-between text-sm">
                    <Badge variant="muted">{status}</Badge>
                    <span className="font-mono text-xs text-[var(--text-muted)]">{count}</span>
                  </li>
                ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="text-sm font-semibold">Drill in</h3>
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
