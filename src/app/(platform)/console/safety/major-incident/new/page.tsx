import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createMajorIncident } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Safety · Major Incident" title="Activate Plan" />
      <div className="page-content max-w-xl">
        <FormShell action={createMajorIncident} cancelHref="/console/safety/major-incident" submitLabel="Activate">
          <Input label="Name" name="name" maxLength={200} placeholder="e.g. Stand collapse — Stadium A" required />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Status</label>
            <select name="status" defaultValue="activated" className="input-base mt-1.5 w-full">
              <option value="activated">Activated</option>
              <option value="ongoing">Ongoing</option>
              <option value="recovery">Recovery</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
