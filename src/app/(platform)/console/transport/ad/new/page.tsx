import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createAdManifest } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Transport" title="New A&D Manifest" />
      <div className="page-content max-w-xl">
        <FormShell action={createAdManifest} cancelHref="/console/transport/ad" submitLabel="Add Manifest">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Direction</label>
            <select name="kind" defaultValue="arrival" className="input-base mt-1.5 w-full">
              <option value="arrival">Arrival</option>
              <option value="departure">Departure</option>
            </select>
          </div>
          <Input label="Flight Reference" name="flight_ref" maxLength={80} placeholder="e.g. AA1234" />
          <Input label="Carrier" name="carrier" maxLength={80} placeholder="e.g. American Airlines" />
          <Input label="Scheduled Time" name="scheduled_at" type="datetime-local" />
          <Input label="Party Size" name="party_size" type="number" min={1} max={2000} defaultValue={1} required />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Notes</label>
            <textarea name="notes" rows={3} maxLength={2000} className="input-base mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
