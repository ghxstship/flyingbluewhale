import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createRoster } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Workforce · Rosters" title="New Roster" />
      <div className="page-content max-w-xl">
        <FormShell action={createRoster} cancelHref="/console/workforce/rosters" submitLabel="Create Roster">
          <Input label="Name" name="name" maxLength={160} placeholder="e.g. Day-3 Stadium Crew" required />
          <Input label="Day Of" name="day_of" type="date" required />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">State</label>
            <select name="state" defaultValue="draft" className="input-base mt-1.5 w-full">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="locked">Locked</option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
