import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createRfqAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Procurement" title="New RFQ" />
      <div className="page-content max-w-xl">
        <FormShell action={createRfqAction} cancelHref="/console/procurement/rfqs" submitLabel="Create RFQ">
          <Input label="Title" name="title" required maxLength={200} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea name="description" rows={4} maxLength={4000} className="input-base mt-1.5 w-full" />
          </div>
          <Input label="Due" name="due_at" type="datetime-local" />
        </FormShell>
      </div>
    </>
  );
}
