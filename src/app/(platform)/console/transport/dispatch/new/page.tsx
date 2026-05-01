import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createDispatchRun } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Transport" title="New Dispatch Run" />
      <div className="page-content max-w-xl">
        <FormShell action={createDispatchRun} cancelHref="/console/transport/dispatch" submitLabel="Schedule Run">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Fleet</label>
            <select name="fleet" defaultValue="t1" className="input-base mt-1.5 w-full">
              <option value="t1">T1 — Athletes</option>
              <option value="t2">T2 — Teams</option>
              <option value="t3">T3 — Olympic Family</option>
              <option value="media">Media</option>
              <option value="workforce">Workforce</option>
              <option value="spectator">Spectator</option>
            </select>
          </div>
          <Input label="Vehicle Reference" name="vehicle_ref" maxLength={80} placeholder="e.g. Bus 14, Van 03" />
          <Input label="Scheduled Departure" name="scheduled_depart" type="datetime-local" required />
          <Input label="Scheduled Arrival" name="scheduled_arrive" type="datetime-local" />
        </FormShell>
      </div>
    </>
  );
}
