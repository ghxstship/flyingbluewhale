import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  const HUB_TILES: Array<{ href: string; label: string; description: string }> = [
    {
      href: "/console/production/equipment",
      label: t("console.logistics.warehouse.tiles.equipment.label", undefined, "Equipment"),
      description: t(
        "console.logistics.warehouse.tiles.equipment.description",
        undefined,
        "Asset register · 5-state lifecycle",
      ),
    },
    {
      href: "/console/production/rentals",
      label: t("console.logistics.warehouse.tiles.rentals.label", undefined, "Rentals"),
      description: t("console.logistics.warehouse.tiles.rentals.description", undefined, "Booking + handover ledger"),
    },
    {
      href: "/console/production/rentals/availability",
      label: t("console.logistics.warehouse.tiles.availability.label", undefined, "Availability"),
      description: t("console.logistics.warehouse.tiles.availability.description", undefined, "7-day matrix"),
    },
    {
      href: "/m/wms",
      label: t("console.logistics.warehouse.tiles.mobileScan.label", undefined, "Mobile Scan"),
      description: t(
        "console.logistics.warehouse.tiles.mobileScan.description",
        undefined,
        "Pick / put-away on COMPVSS",
      ),
    },
    {
      href: "/console/logistics/disposition",
      label: t("console.logistics.warehouse.tiles.disposition.label", undefined, "Disposition"),
      description: t("console.logistics.warehouse.tiles.disposition.description", undefined, "Retired + maintenance"),
    },
    {
      href: "/console/logistics/services",
      label: t("console.logistics.warehouse.tiles.services.label", undefined, "Services"),
      description: t("console.logistics.warehouse.tiles.services.description", undefined, "Waste + cleaning requests"),
    },
  ];
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.logistics.eyebrow", undefined, "Logistics")}
          title={t("console.logistics.warehouse.title", undefined, "Warehouse")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.common.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.logistics.eyebrow", undefined, "Logistics")}
        title={t("console.logistics.warehouse.title", undefined, "Warehouse")}
        subtitle={t("console.logistics.warehouse.subtitle", undefined, "FF&E + central + venue warehousing")}
        action={
          <Button href="/m/wms" size="sm">
            {t("console.logistics.warehouse.mobileScanButton", undefined, "Mobile scan")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.logistics.warehouse.metrics.assets", undefined, "Assets")}
            value={fmt.number(assetCount ?? 0)}
            accent
          />
          <MetricCard
            label={t("console.logistics.warehouse.metrics.locations", undefined, "Locations")}
            value={fmt.number(locationCount ?? 0)}
          />
          <MetricCard
            label={t("console.logistics.warehouse.metrics.inMaintenance", undefined, "In Maintenance")}
            value={fmt.number(maintenanceCount ?? 0)}
          />
        </div>

        {Object.keys(buckets).length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">
              {t("console.logistics.warehouse.byStatus", undefined, "By Status")}
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-3">
              {Object.entries(buckets)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <li key={status} className="flex items-center justify-between text-sm">
                    <Badge variant="muted">{status}</Badge>
                    <span className="font-mono text-xs text-[var(--p-text-2)]">{fmt.number(count)}</span>
                  </li>
                ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="text-sm font-semibold">{t("console.logistics.warehouse.drillIn", undefined, "Drill In")}</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {HUB_TILES.map((tile) => (
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
