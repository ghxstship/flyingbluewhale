import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createEnvEvent } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Safety · Environmental" title="Log Event" />
      <div className="page-content max-w-xl">
        <FormShell action={createEnvEvent} cancelHref="/console/safety/environmental" submitLabel="Log Event">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Kind</label>
            <select name="kind" defaultValue="heat" className="input-base mt-1.5 w-full" required>
              <option value="heat">Heat</option>
              <option value="cold">Cold</option>
              <option value="wind">Wind</option>
              <option value="storm">Storm</option>
              <option value="lightning">Lightning</option>
              <option value="air_quality">Air quality</option>
              <option value="wildlife">Wildlife</option>
              <option value="biohazard">Biohazard</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Severity</label>
            <select name="severity" defaultValue="advisory" className="input-base mt-1.5 w-full" required>
              <option value="advisory">Advisory</option>
              <option value="watch">Watch</option>
              <option value="warning">Warning</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <Input label="Started At" name="started_at" type="datetime-local" />
          <Input label="Ended At" name="ended_at" type="datetime-local" />
        </FormShell>
      </div>
    </>
  );
}
