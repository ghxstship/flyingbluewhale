export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell } from "@/components/detail/DetailShell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { getRequestT } from "@/lib/i18n/request";
import { deleteLocation } from "./edit/actions";
import { GeofenceSection } from "./GeofenceSection";

/**
 * Location detail (canonical home, decision 6 rider). Moved from
 * /studio/locations/[locationId].
 */
export default async function LocationDetailPage({ params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = await params;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("locations")
    .select("id, name, address, city, country, postcode, lat, lng, notes")
    .eq("org_id", session.orgId)
    .eq("id", locationId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow={t("console.legend.hub.title", undefined, "Organization Hub")}
      title={(r) => r.name}
      subtitle={(r) => r.address}
      breadcrumbs={[
        { label: t("console.legend.hub.breadcrumb", undefined, "LEG3ND") },
        { label: t("console.legend.hub.title", undefined, "Organization Hub"), href: "/legend/hub" },
        {
          label: t("console.locations.detail.breadcrumb.locations", undefined, "Locations"),
          href: "/legend/hub/locations",
        },
        { label: row?.name ?? t("console.locations.detail.breadcrumb.fallback", undefined, "Location") },
      ]}
      fields={
        row
          ? [
              { label: t("console.locations.detail.fields.address", undefined, "Address"), value: row.address ?? "—" },
              { label: t("console.locations.detail.fields.city", undefined, "City"), value: row.city ?? "—" },
              {
                label: t("console.locations.detail.fields.postcode", undefined, "Postcode"),
                value: row.postcode ?? "—",
              },
              { label: t("console.locations.detail.fields.country", undefined, "Country"), value: row.country ?? "—" },
              {
                label: t("console.locations.detail.fields.coordinates", undefined, "Coordinates"),
                value: row.lat != null && row.lng != null ? `${row.lat}, ${row.lng}` : "—",
              },
              { label: t("console.locations.detail.fields.notes", undefined, "Notes"), value: row.notes ?? "—" },
            ]
          : undefined
      }
      action={
        row ? (
          <div className="flex items-center gap-2">
            <Button href={`/legend/hub/locations/${locationId}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteLocation.bind(null, locationId)}
              confirm={t(
                "console.locations.detail.deleteConfirm",
                { name: row.name },
                `Delete location "${row.name}"? This cannot be undone.`,
              )}
            />
          </div>
        ) : undefined
      }
    >
      {/* T1-5 camera-first capture: the venue's auto-filing circles live on
          the space registry's canonical detail (this page). */}
      {row && (
        <GeofenceSection
          locationId={locationId}
          orgId={session.orgId}
          locationLat={row.lat != null ? Number(row.lat) : null}
          locationLng={row.lng != null ? Number(row.lng) : null}
        />
      )}
    </DetailShell>
  );
}
