import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createEncounter } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Medical · Encounter" title="Log Encounter" />
      <div className="page-content max-w-xl">
        <FormShell action={createEncounter} cancelHref="/console/safety/medical/encounters" submitLabel="Log encounter">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Triage</label>
            <select name="triage" defaultValue="green" className="input-base mt-1.5 w-full">
              <option value="green">Green (minor)</option>
              <option value="yellow">Yellow (urgent)</option>
              <option value="red">Red (immediate)</option>
              <option value="black">Black (deceased)</option>
            </select>
          </div>
          <Input label="Patient Reference" name="patient_ref" maxLength={120} placeholder="Pseudonymous ID" />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Chief Complaint</label>
            <textarea name="chief_complaint" rows={3} maxLength={500} className="input-base mt-1.5 w-full" />
          </div>
          <Input
            label="Disposition"
            name="disposition"
            maxLength={120}
            placeholder="e.g. Discharged, Hospital transfer"
          />
        </FormShell>
      </div>
    </>
  );
}
