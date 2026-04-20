export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money, fmtDate } from "@/components/detail/DetailShell";


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
      breadcrumbs={[{ label: "Operations" }, { label: "Locations", href: "/console/locations" }, { label: row?.name ?? "Location" }]}
      fields={row ? [
        { label: "Address", value: row.address ?? "—" },
        { label: "City", value: row.city ?? "—" },
        { label: "Postcode", value: row.postcode ?? "—" },
        { label: "Country", value: row.country ?? "—" },
        { label: "Coordinates", value: row.lat != null && row.lng != null ? `${row.lat}, ${row.lng}` : "—" },
        { label: "Notes", value: row.notes ?? "—" },
      ] : undefined}
    />
  );
}
