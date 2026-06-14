import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createSheetAction } from "../actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Sheets" title="New Sheet" />
      <div className="page-content max-w-xl">
        <FormShell action={createSheetAction} cancelHref="/console/collaborate/sheets" submitLabel="Create Sheet">
          <Input label="Name" name="name" required maxLength={200} placeholder="Q3 Crew Tracker" />
          <div>
            <label htmlFor="sheet-description" className="text-xs font-medium text-[var(--p-text-2)]">
              Description
            </label>
            <textarea
              id="sheet-description"
              name="description"
              rows={3}
              maxLength={4000}
              className="ps-input mt-1.5 w-full"
            />
          </div>
        </FormShell>
      </div>
    </>
  );
}
