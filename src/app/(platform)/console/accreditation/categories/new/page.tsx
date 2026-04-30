import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createCategory } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Accreditation" title="New Category" />
      <div className="page-content max-w-xl">
        <FormShell action={createCategory} cancelHref="/console/accreditation/categories" submitLabel="Add category">
          <Input label="Code" name="code" maxLength={40} placeholder="e.g. ATH, OFF, MED" required />
          <Input label="Name" name="name" maxLength={120} placeholder="e.g. Athletes" required />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea name="description" rows={3} maxLength={500} className="input-base mt-1.5 w-full" />
          </div>
          <Input label="Color (hex or token)" name="color" maxLength={20} placeholder="hex or var(--token)" />
        </FormShell>
      </div>
    </>
  );
}
