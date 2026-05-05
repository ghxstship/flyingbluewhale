import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createTieredHoldAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader
        eyebrow="Bookings"
        title="New Hold"
        subtitle="Tier 1 = first refusal. Releasing a higher tier auto-promotes the next."
      />
      <div className="page-content max-w-xl">
        <FormShell action={createTieredHoldAction} cancelHref="/console/bookings/holds" submitLabel="Place Hold">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Tier</label>
              <select name="tier" className="input-base mt-1.5 w-full" defaultValue="1">
                <option value="1">Tier 1 (first refusal)</option>
                <option value="2">Tier 2</option>
                <option value="3">Tier 3</option>
                <option value="4">Tier 4</option>
                <option value="5">Tier 5</option>
              </select>
            </div>
            <Input label="Label" name="label" placeholder="MMW26 mainstage" maxLength={200} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Starts" name="starts_at" type="datetime-local" required />
            <Input label="Ends" name="ends_at" type="datetime-local" required />
          </div>
          <Input label="Auto-release on" name="auto_release_on" type="datetime-local" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Venue ID (optional)" name="venue_id" placeholder="UUID" />
            <Input label="Talent Profile ID (optional)" name="talent_profile_id" placeholder="UUID" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
