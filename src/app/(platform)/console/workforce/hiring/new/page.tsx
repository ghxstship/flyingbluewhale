import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createPositionAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Workforce" title="New Position" />
      <div className="page-content max-w-2xl">
        <FormShell action={createPositionAction} cancelHref="/console/workforce/hiring" submitLabel="Create Position">
          <Input label="Title" name="title" required maxLength={120} />
          <Input label="Department" name="department" maxLength={80} />
          <Input label="Location" name="location" maxLength={120} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Employment Type</label>
            <select name="employment_type" className="input-base mt-1.5 w-full">
              <option value="">— Select —</option>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contractor">Contractor</option>
              <option value="freelance">Freelance</option>
              <option value="volunteer">Volunteer</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea name="description" rows={5} maxLength={4000} className="input-base mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
