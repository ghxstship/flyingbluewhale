import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createZoneAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  let projects: Array<{ id: string; name: string }> = [];
  if (hasSupabase) {
    const session = await requireSession();
    const supabase = await createClient();
    const { data } = await supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("name");
    projects = (data ?? []) as Array<{ id: string; name: string }>;
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.timeClockZones.eyebrow", undefined, "Time-Clock Zones")}
        title={t("console.settings.timeClockZones.new.title", undefined, "New Zone")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createZoneAction}
          cancelHref="/studio/settings/time-clock-zones"
          submitLabel={t("common.create", undefined, "Create")}
        >
          <Input
            label={t("console.settings.timeClockZones.new.name", undefined, "Name")}
            name="name"
            required
            maxLength={120}
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.settings.timeClockZones.new.projectOptional", undefined, "Project · Optional")}
            </label>
            <select name="project_id" className="ps-input mt-1.5 w-full" defaultValue="">
              <option value="">
                {t("console.settings.timeClockZones.new.projectNone", undefined, "None — org-wide")}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t("console.settings.timeClockZones.new.centerLat", undefined, "Center latitude")}
            name="center_lat"
            type="number"
            step="0.000001"
            min="-90"
            max="90"
            required
            hint={t(
              "console.settings.timeClockZones.new.centerLatHint",
              undefined,
              "Use Google Maps; copy the first number from the coords.",
            )}
          />
          <Input
            label={t("console.settings.timeClockZones.new.centerLng", undefined, "Center longitude")}
            name="center_lng"
            type="number"
            step="0.000001"
            min="-180"
            max="180"
            required
          />
          <Input
            label={t("console.settings.timeClockZones.new.radius", undefined, "Radius — Meters")}
            name="radius_m"
            type="number"
            step="1"
            min="25"
            max="5000"
            required
            hint={t(
              "console.settings.timeClockZones.new.radiusHint",
              undefined,
              "Between 25 m (tight) and 5 km (whole venue). Default 150 m suits most worksites.",
            )}
            defaultValue="150"
          />
        </FormShell>
      </div>
    </>
  );
}
