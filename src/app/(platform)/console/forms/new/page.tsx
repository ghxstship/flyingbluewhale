import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createFormDefAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Forms" title="New form" />
      <div className="page-content max-w-xl">
        <FormShell action={createFormDefAction} cancelHref="/console/forms" submitLabel="Create form">
          <Input
            label="Slug"
            name="slug"
            required
            maxLength={120}
            placeholder="incident-report"
            hint="Lowercase, dashes ok. Used in the form's URL."
          />
          <Input label="Title" name="title" required maxLength={200} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea name="description" rows={3} maxLength={2000} className="input-base mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
