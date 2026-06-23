import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createGuardTour } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  let venues: Array<{ id: string; name: string }> = [];
  if (hasSupabase) {
    const session = await requireSession();
    venues = (await listOrgScoped("venues", session.orgId, {
      orderBy: "name",
      ascending: true,
      limit: 500,
    })) as Array<{ id: string; name: string }>;
  }
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.guardTours.new.eyebrow", undefined, "Safety")}
        title={t("console.safety.guardTours.new.title", undefined, "New Guard Tour")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createGuardTour}
          cancelHref="/studio/safety/guard-tours"
          submitLabel={t("console.safety.guardTours.new.submit", undefined, "Schedule Tour")}
        >
          <Input
            label={t("console.safety.guardTours.new.nameLabel", undefined, "Name")}
            name="name"
            maxLength={200}
            placeholder={t("console.safety.guardTours.new.namePlaceholder", undefined, "Perimeter sweep — Stadium A")}
            required
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.guardTours.new.descriptionLabel", undefined, "Description")}
            </label>
            <textarea
              name="description"
              rows={3}
              maxLength={2000}
              className="ps-input mt-1.5 w-full"
              placeholder={t(
                "console.safety.guardTours.new.descriptionPlaceholder",
                undefined,
                "What the patrol checks for; any special instructions.",
              )}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.guardTours.new.venueLabel", undefined, "Venue · Optional")}
            </label>
            <select name="venue_id" defaultValue="" className="ps-input mt-1.5 w-full">
              <option value="">
                {t("console.safety.guardTours.new.venueNone", undefined, "— None / multi-venue —")}
              </option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t("console.safety.guardTours.new.cadenceLabel", undefined, "Cadence — Minutes")}
            name="cadence_minutes"
            type="number"
            min={0}
            max={10080}
            placeholder={t(
              "console.safety.guardTours.new.cadencePlaceholder",
              undefined,
              "60 = hourly · leave blank for ad-hoc",
            )}
          />
          <p className="text-xs text-[var(--p-text-2)]">
            {t(
              "console.safety.guardTours.new.waypointsHint",
              undefined,
              "Route waypoints (checkpoints, lat/lng) are added on the tour detail page after creation.",
            )}
          </p>
        </FormShell>
      </div>
    </>
  );
}
