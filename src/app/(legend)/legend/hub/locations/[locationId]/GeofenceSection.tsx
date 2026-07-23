import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { createGeofence, deleteGeofence, toggleGeofence, type GeofenceState } from "./geofence-actions";

/**
 * Capture Geofences (T1-5) — the minimal tier-1 admin for `venue_geofences`,
 * rendered on the LEG3ND hub location detail. Lat/lng + radius entry (no map
 * widget); the create form prefills from the location's own coordinates so
 * "center it on the venue" is the zero-typing default.
 */
export async function GeofenceSection({
  locationId,
  orgId,
  locationLat,
  locationLng,
}: {
  locationId: string;
  orgId: string;
  locationLat: number | null;
  locationLng: number | null;
}) {
  const { t } = await getRequestT();
  const supabase = await createClient();

  const [{ data: fenceRows }, { data: projRows }] = await Promise.all([
    supabase
      .from("venue_geofences")
      .select("id, label, center_lat, center_lng, radius_m, active, project_id")
      .eq("org_id", orgId)
      .eq("location_id", locationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", orgId)
      .eq("project_state", "active")
      .is("deleted_at", null)
      .order("start_date", { ascending: false, nullsFirst: false })
      .limit(100),
  ]);
  const fences = fenceRows ?? [];
  const projects = projRows ?? [];
  const projectName = new Map(projects.map((p) => [p.id, p.name]));

  const action = createGeofence.bind(null, locationId) as unknown as (
    state: GeofenceState,
    fd: FormData,
  ) => Promise<GeofenceState>;

  return (
    <section className="space-y-3">
      <div>
        <h2>{t("console.locations.geofences.title", undefined, "Capture Geofences")}</h2>
        <p className="ps-caption mt-1">
          {t(
            "console.locations.geofences.intro",
            undefined,
            "Circles around this venue. A field photo taken inside one files itself to the linked show's daily log.",
          )}
        </p>
      </div>

      {fences.length > 0 && (
        <div className="surface divide-y divide-[var(--p-border)]">
          {fences.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--p-text-1)]">
                    {f.label || t("console.locations.geofences.unnamed", undefined, "Unnamed fence")}
                  </span>
                  <Badge variant={f.active ? "success" : "default"}>
                    {f.active
                      ? t("console.locations.geofences.active", undefined, "Active")
                      : t("console.locations.geofences.inactive", undefined, "Off")}
                  </Badge>
                </div>
                <div className="ps-caption mt-0.5">
                  {`${f.center_lat}, ${f.center_lng} · ${f.radius_m} m`}
                  {f.project_id
                    ? ` · ${t(
                        "console.locations.geofences.filesTo",
                        { project: projectName.get(f.project_id) ?? "" },
                        `Files to ${projectName.get(f.project_id) ?? "a project"}`,
                      )}`
                    : ` · ${t("console.locations.geofences.autoLinked", undefined, "Show resolved from venue schedule")}`}
                </div>
              </div>
              <form action={toggleGeofence.bind(null, f.id, locationId)}>
                <Button type="submit" size="sm" variant="secondary">
                  {f.active
                    ? t("console.locations.geofences.turnOff", undefined, "Turn Off")
                    : t("console.locations.geofences.turnOn", undefined, "Turn On")}
                </Button>
              </form>
              <DeleteForm
                action={deleteGeofence.bind(null, f.id, locationId)}
                confirm={t(
                  "console.locations.geofences.deleteConfirm",
                  undefined,
                  "Delete this geofence? Photos already filed stay where they are.",
                )}
              />
            </div>
          ))}
        </div>
      )}

      <FormShell
        action={action}
        submitLabel={t("console.locations.geofences.submit", undefined, "Add Geofence")}
        dirtyGuard={false}
      >
        <Input
          label={t("console.locations.geofences.fields.label", undefined, "Label")}
          name="label"
          placeholder={t("console.locations.geofences.fields.labelPh", undefined, "e.g. Load-In Gate")}
          maxLength={120}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("console.locations.geofences.fields.lat", undefined, "Center Latitude")}
            name="center_lat"
            type="number"
            step="any"
            required
            defaultValue={locationLat ?? undefined}
          />
          <Input
            label={t("console.locations.geofences.fields.lng", undefined, "Center Longitude")}
            name="center_lng"
            type="number"
            step="any"
            required
            defaultValue={locationLng ?? undefined}
          />
        </div>
        <Input
          label={t("console.locations.geofences.fields.radius", undefined, "Radius (meters)")}
          name="radius_m"
          type="number"
          min={10}
          max={10000}
          required
          defaultValue={250}
        />
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]" htmlFor="geofence-project">
            {t("console.locations.geofences.fields.project", undefined, "Active-Event Override")}
          </label>
          <select id="geofence-project" name="project_id" className="ps-input mt-1.5 w-full" defaultValue="">
            <option value="">
              {t("console.locations.geofences.fields.projectAuto", undefined, "Auto (venues & events at this location)")}
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="ps-caption mt-1">
            {t(
              "console.locations.geofences.fields.projectHint",
              undefined,
              "Leave on Auto unless one show should always win at this venue.",
            )}
          </p>
        </div>
      </FormShell>
    </section>
  );
}
