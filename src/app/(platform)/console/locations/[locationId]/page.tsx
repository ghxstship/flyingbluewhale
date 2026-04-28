export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell } from "@/components/detail/DetailShell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { deleteLocation } from "./edit/actions";

export default async function Page({ params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = await params;
  const session = await requireSession();
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
      eyebrow="Operations"
      title={(r) => r.name}
      subtitle={(r) => r.address}
      breadcrumbs={[
        { label: "Operations" },
        { label: "Locations", href: "/console/locations" },
        { label: row?.name ?? "Location" },
      ]}
      fields={
        row
          ? [
              { label: "Address", value: row.address ?? "—" },
              { label: "City", value: row.city ?? "—" },
              { label: "Postcode", value: row.postcode ?? "—" },
              { label: "Country", value: row.country ?? "—" },
              { label: "Coordinates", value: row.lat != null && row.lng != null ? `${row.lat}, ${row.lng}` : "—" },
              { label: "Notes", value: row.notes ?? "—" },
            ]
          : undefined
      }
      action={
        row ? (
          <div className="flex items-center gap-2">
            <Button href={`/console/locations/${locationId}/edit`} size="sm" variant="secondary">
              Edit
            </Button>
            <DeleteForm
              action={deleteLocation.bind(null, locationId)}
              confirm={`Delete location "${row.name}"? This cannot be undone.`}
            />
          </div>
        ) : undefined
      }
    />
  );
}
