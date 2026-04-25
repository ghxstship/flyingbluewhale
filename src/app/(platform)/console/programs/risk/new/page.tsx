import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createRiskAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Risk register" title="New risk" />
      <div className="page-content max-w-xl">
        <FormShell action={createRiskAction} cancelHref="/console/programs/risk" submitLabel="Create risk">
          <Input label="Title" name="title" required maxLength={200} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea name="description" rows={4} className="input-base mt-1.5 w-full" maxLength={4000} />
          </div>
          <Input label="Category" name="category" maxLength={80} />
        </FormShell>
      </div>
    </>
  );
}
