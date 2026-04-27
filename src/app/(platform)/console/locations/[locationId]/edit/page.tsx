import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateLocation, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ locationId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("locations", session.orgId, p.locationId);
  if (!row) notFound();
  const action = updateLocation.bind(null, p.locationId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Location" title={`Edit ${row.name}`} />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/locations/${p.locationId}`} submitLabel="Save changes">
          <Input label="Name" name="name" defaultValue={row.name} required maxLength={200} />
          <Input label="Address" name="address" defaultValue={row.address ?? ""} maxLength={300} />
          <Input label="City" name="city" defaultValue={row.city ?? ""} maxLength={120} />
          <Input label="Region" name="region" defaultValue={row.region ?? ""} maxLength={120} />
          <Input label="Postcode" name="postcode" defaultValue={row.postcode ?? ""} maxLength={40} />
          <Input label="Country" name="country" defaultValue={row.country ?? ""} maxLength={120} />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latitude"
              name="lat"
              type="number"
              step="any"
              defaultValue={row.lat != null ? String(row.lat) : ""}
            />
            <Input
              label="Longitude"
              name="lng"
              type="number"
              step="any"
              defaultValue={row.lng != null ? String(row.lng) : ""}
            />
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Notes</span>
            <textarea
              name="notes"
              defaultValue={row.notes ?? ""}
              maxLength={4000}
              rows={4}
              className="input-base focus-ring w-full"
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
