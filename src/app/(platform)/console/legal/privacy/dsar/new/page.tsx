import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createDsar } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Legal · Privacy" title="New DSAR Request" />
      <div className="page-content max-w-xl">
        <FormShell action={createDsar} cancelHref="/console/legal/privacy/dsar" submitLabel="Log Request">
          <Input label="Requester Email" name="requester_email" type="email" required />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Kind</label>
            <select name="kind" defaultValue="access" className="input-base mt-1.5 w-full" required>
              <option value="access">Access</option>
              <option value="deletion">Deletion</option>
              <option value="correction">Correction</option>
              <option value="portability">Portability</option>
              <option value="objection">Objection</option>
            </select>
          </div>
          <Input label="Due By" name="due_by" type="date" />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Notes</label>
            <textarea name="notes" rows={3} maxLength={2000} className="input-base mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
