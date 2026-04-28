import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createEntitlement } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Commercial · Sponsors" title="New Entitlement" />
      <div className="page-content max-w-xl">
        <FormShell action={createEntitlement} cancelHref="/console/commercial/sponsors" submitLabel="Add entitlement">
          <Input label="Title" name="title" maxLength={160} placeholder="e.g. Tier-1 hospitality (8 guests)" required />
          <Input label="Quantity" name="quantity" type="number" min={0} max={1000000} defaultValue={1} required />
          <Input label="Due By" name="due_by" type="date" />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Status</label>
            <select name="status" defaultValue="open" className="input-base mt-1.5 w-full">
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="delivered">Delivered</option>
              <option value="waived">Waived</option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
