import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateLocation, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function EditLocationPage({ params }: { params: Promise<{ locationId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("locations", session.orgId, p.locationId);
  if (!row) notFound();
  const { t } = await getRequestT();
  const action = updateLocation.bind(null, p.locationId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Organization Hub"
        title={t("console.locations.edit.title", { name: row.name }, `Edit ${row.name}`)}
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Organization Hub", href: "/legend/hub" },
          { label: "Locations", href: "/legend/hub/locations" },
          { label: row.name, href: `/legend/hub/locations/${p.locationId}` },
          { label: "Edit" },
        ]}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/legend/hub/locations/${p.locationId}`}
          submitLabel={t("console.locations.edit.submit", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.locations.edit.fields.name", undefined, "Name")}
            name="name"
            defaultValue={row.name}
            required
            maxLength={200}
          />
          <Input
            label={t("console.locations.edit.fields.address", undefined, "Address")}
            name="address"
            defaultValue={row.address ?? ""}
            maxLength={300}
          />
          <Input
            label={t("console.locations.edit.fields.city", undefined, "City")}
            name="city"
            defaultValue={row.city ?? ""}
            maxLength={120}
          />
          <Input
            label={t("console.locations.edit.fields.region", undefined, "Region")}
            name="region"
            defaultValue={row.region ?? ""}
            maxLength={120}
          />
          <Input
            label={t("console.locations.edit.fields.postcode", undefined, "Postcode")}
            name="postcode"
            defaultValue={row.postcode ?? ""}
            maxLength={40}
          />
          <Input
            label={t("console.locations.edit.fields.country", undefined, "Country")}
            name="country"
            defaultValue={row.country ?? ""}
            maxLength={120}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("console.locations.edit.fields.latitude", undefined, "Latitude")}
              name="lat"
              type="number"
              step="any"
              defaultValue={row.lat != null ? String(row.lat) : ""}
            />
            <Input
              label={t("console.locations.edit.fields.longitude", undefined, "Longitude")}
              name="lng"
              type="number"
              step="any"
              defaultValue={row.lng != null ? String(row.lng) : ""}
            />
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.locations.edit.fields.notes", undefined, "Notes")}
            </span>
            <textarea
              name="notes"
              defaultValue={row.notes ?? ""}
              maxLength={4000}
              rows={4}
              className="ps-input focus-ring w-full"
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
