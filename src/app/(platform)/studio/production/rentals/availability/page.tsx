import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type AssetRow = {
  id: string;
  display_name: string;
  asset_tag: string | null;
  asset_kind: string | null;
  state:
    | "acquired"
    | "available"
    | "reserved"
    | "in_transit"
    | "in_use"
    | "returned"
    | "in_maintenance"
    | "retired"
    | "lost"
    | string;
};

type RentalRow = {
  id: string;
  asset_id: string;
  starts_at: string;
  ends_at: string;
  project: { id: string; name: string } | null;
};

function inWindow(r: RentalRow, fromIso: string, toIso: string): boolean {
  return !(r.ends_at < fromIso || r.starts_at > toIso);
}

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.production.rentals.availability.eyebrow", undefined, "Production · Rentals")}
          title={t("console.production.rentals.availability.title", undefined, "Availability")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.production.rentals.availability.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  // Window: today + next 7 days
  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
  const fromIso = windowStart.toISOString();
  const toIso = windowEnd.toISOString();

  const [{ data: assets }, { data: rentals }] = await Promise.all([
    supabase
      .from("assets")
      .select("id, display_name, asset_tag, asset_kind, state")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .neq("state", "retired")
      .order("display_name", { ascending: true })
      .limit(500),
    supabase
      .from("rentals")
      .select("id, asset_id, starts_at, ends_at, project:project_id(id, name)")
      .eq("org_id", session.orgId)
      .lte("starts_at", toIso)
      .gte("ends_at", fromIso)
      .order("starts_at", { ascending: true }),
  ]);

  const assetList = (assets ?? []) as AssetRow[];
  const rentalList = ((rentals ?? []) as unknown as RentalRow[]).filter((r) => inWindow(r, fromIso, toIso));

  // Group rentals by asset_id
  const rentalsByAsset = new Map<string, RentalRow[]>();
  for (const r of rentalList) {
    if (!rentalsByAsset.has(r.asset_id)) rentalsByAsset.set(r.asset_id, []);
    rentalsByAsset.get(r.asset_id)!.push(r);
  }

  // Build a 7-day grid for each asset row
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i));
  }

  function statusForDay(asset: AssetRow, day: Date): "free" | "booked" | "blocked" {
    if (asset.state === "in_maintenance") return "blocked";
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString();
    const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).toISOString();
    const list = rentalsByAsset.get(asset.id) ?? [];
    return list.some((r) => inWindow(r, dayStart, dayEnd)) ? "booked" : "free";
  }

  // Roll-up: how many available now
  const availableNow = assetList.filter((a) => a.state === "available").length;
  const reservedNow = assetList.filter((a) => a.state === "reserved").length;
  const inUseNow = assetList.filter((a) => a.state === "in_use").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.rentals.availability.eyebrow", undefined, "Production · Rentals")}
        title={t("console.production.rentals.availability.title", undefined, "Availability")}
        subtitle={t(
          "console.production.rentals.availability.subtitle",
          { available: availableNow, reserved: reservedNow, inUse: inUseNow },
          `${availableNow} available · ${reservedNow} reserved · ${inUseNow} in use`,
        )}
        action={
          <Button href="/studio/production/rentals/new" size="sm">
            {t("console.production.rentals.availability.newRental", undefined, "+ New Rental")}
          </Button>
        }
      />
      <div className="page-content">
        {assetList.length === 0 ? (
          <EmptyState
            title={t("console.production.rentals.availability.empty.title", undefined, "No Assets to Show")}
            description={t(
              "console.production.rentals.availability.empty.description",
              undefined,
              "Author assets in /studio/assets, then bookings + availability surface here.",
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.production.rentals.availability.col.asset", undefined, "Asset")}</th>
                  <th>{t("console.production.rentals.availability.col.state", undefined, "Status")}</th>
                  {days.map((d) => (
                    <th key={d.toISOString()} className="text-center text-xs">
                      {fmt.dateParts(d, { weekday: "short", month: "numeric", day: "numeric" })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assetList.slice(0, 200).map((asset) => (
                  <tr key={asset.id}>
                    <td>
                      <div className="text-sm font-medium">
                        <Link href={`/studio/assets/${asset.id}`} className="hover:underline">
                          {asset.display_name}
                        </Link>
                      </div>
                      <div className="font-mono text-[10px] text-[var(--p-text-2)]">
                        {asset.asset_tag ?? "—"} {asset.asset_kind ? `· ${asset.asset_kind}` : ""}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={asset.state} />
                    </td>
                    {days.map((d) => {
                      const s = statusForDay(asset, d);
                      const tone = s === "free" ? "success" : s === "booked" ? "warning" : "error";
                      const label =
                        s === "free"
                          ? t("console.production.rentals.availability.day.free", undefined, "free")
                          : s === "booked"
                            ? t("console.production.rentals.availability.day.booked", undefined, "booked")
                            : t("console.production.rentals.availability.day.blocked", undefined, "blocked");
                      return (
                        <td key={d.toISOString()} className="text-center">
                          <Badge variant={tone}>{label}</Badge>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {assetList.length > 200 && (
              <p className="px-4 py-3 text-xs text-[var(--p-text-2)]">
                {t(
                  "console.production.rentals.availability.truncationNote",
                  undefined,
                  "Showing first 200 assets. Filter by kind in /studio/assets for narrower views.",
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
