import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { createGuardTour } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
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
      <ModuleHeader eyebrow="Safety" title="New Guard Tour" />
      <div className="page-content max-w-xl">
        <FormShell action={createGuardTour} cancelHref="/console/safety/guard-tours" submitLabel="Schedule Tour">
          <Input label="Name" name="name" maxLength={200} placeholder="Perimeter sweep — Stadium A" required />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea
              name="description"
              rows={3}
              maxLength={2000}
              className="input-base mt-1.5 w-full"
              placeholder="What the patrol checks for; any special instructions."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Venue (optional)</label>
            <select name="venue_id" defaultValue="" className="input-base mt-1.5 w-full">
              <option value="">— None / multi-venue —</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Cadence (minutes)"
            name="cadence_minutes"
            type="number"
            min={0}
            max={10080}
            placeholder="60 = hourly · leave blank for ad-hoc"
          />
          <p className="text-xs text-[var(--text-muted)]">
            Route waypoints (checkpoints, lat/lng) are added on the tour detail page after creation.
          </p>
        </FormShell>
      </div>
    </>
  );
}
