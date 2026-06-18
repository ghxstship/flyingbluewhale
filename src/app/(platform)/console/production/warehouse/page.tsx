import Link from "next/link";
import { urlFor } from "@/lib/urls";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.production.eyebrow", undefined, "Production")}
          title={t("console.production.warehouse.title", undefined, "Warehouse")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.production.warehouse.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();

  const hubTiles: Array<{ href: string; label: string; description: string }> = [
    {
      href: "/console/production/warehouse/inventory",
      label: t("console.production.warehouse.tiles.inventory.label", undefined, "Inventory"),
      description: t(
        "console.production.warehouse.tiles.inventory.description",
        undefined,
        "Every asset across all locations",
      ),
    },
    {
      href: "/console/production/warehouse/locations",
      label: t("console.production.warehouse.tiles.locations.label", undefined, "Locations"),
      description: t(
        "console.production.warehouse.tiles.locations.description",
        undefined,
        "Bins, bays, depots, venue back-of-house",
      ),
    },
    {
      href: "/console/production/equipment",
      label: t("console.production.warehouse.tiles.equipment.label", undefined, "Equipment"),
      description: t(
        "console.production.warehouse.tiles.equipment.description",
        undefined,
        "Asset register · 5-state lifecycle",
      ),
    },
    {
      href: "/console/production/rentals",
      label: t("console.production.warehouse.tiles.rentals.label", undefined, "Rentals"),
      description: t(
        "console.production.warehouse.tiles.rentals.description",
        undefined,
        "Bookings + handover tracking",
      ),
    },
    {
      href: "/console/production/rentals/availability",
      label: t("console.production.warehouse.tiles.availability.label", undefined, "Availability"),
      description: t("console.production.warehouse.tiles.availability.description", undefined, "7-day matrix"),
    },
    {
      href: urlFor("mobile", "/inventory/scan"),
      label: t("console.production.warehouse.tiles.mobileScan.label", undefined, "Mobile Scan"),
      description: t(
        "console.production.warehouse.tiles.mobileScan.description",
        undefined,
        "Receive / put-away / pick",
      ),
    },
  ];
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
      supabase
        .from("equipment")
        .select("equipment_state")
        .eq("org_id", session.orgId)
        .is("deleted_at", null)
        .limit(2000),
    ]);

  const activeRentals = (rentalsData ?? []).length;
  const statusBuckets = ((equipmentByStatus ?? []) as Array<{ equipment_state: string }>).reduce<
    Record<string, number>
  >((acc, r) => {
    acc[r.equipment_state] = (acc[r.equipment_state] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.eyebrow", undefined, "Production")}
        title={t("console.production.warehouse.title", undefined, "Warehouse")}
        subtitle={t("console.production.warehouse.subtitle", undefined, "Central + venue warehousing hub")}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.production.warehouse.metrics.assets", undefined, "Assets")}
            value={fmt.number(assetCount ?? 0)}
            accent
          />
          <MetricCard
            label={t("console.production.warehouse.metrics.locations", undefined, "Locations")}
            value={fmt.number(locationCount ?? 0)}
          />
          <MetricCard
            label={t("console.production.warehouse.metrics.activeRentals", undefined, "Active Rentals")}
            value={fmt.number(activeRentals)}
          />
        </div>

        {Object.keys(statusBuckets).length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">
              {t("console.production.warehouse.byStatus", undefined, "By Status")}
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-3">
              {Object.entries(statusBuckets)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <li key={status} className="flex items-center justify-between text-sm">
                    <Badge variant="muted">{status}</Badge>
                    <span className="font-mono text-xs text-[var(--p-text-2)]">{count}</span>
                  </li>
                ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="text-sm font-semibold">{t("console.production.warehouse.drillIn", undefined, "Drill In")}</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hubTiles.map((tile) => (
              <Link key={tile.href} href={tile.href} className="surface hover-lift p-4">
                <div className="text-sm font-medium">{tile.label}</div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">{tile.description}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
