import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createExercise } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Programs · Readiness" title="New Exercise" />
      <div className="page-content max-w-xl">
        <FormShell action={createExercise} cancelHref="/console/programs/readiness" submitLabel="Schedule Exercise">
          <Input label="Name" name="name" maxLength={200} placeholder="e.g. Stadium evacuation TTX" required />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Kind</label>
            <select name="kind" defaultValue="tabletop" className="input-base mt-1.5 w-full">
              <option value="tabletop">Tabletop</option>
              <option value="walkthrough">Walkthrough</option>
              <option value="functional">Functional</option>
              <option value="full_scale">Full-scale</option>
              <option value="aar">After-action review</option>
            </select>
          </div>
          <Input label="Scheduled At" name="scheduled_at" type="datetime-local" />
        </FormShell>
      </div>
    </>
  );
}
