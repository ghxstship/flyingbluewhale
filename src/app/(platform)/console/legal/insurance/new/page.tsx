import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createPolicy } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Legal · Insurance" title="New Policy" />
      <div className="page-content max-w-xl">
        <FormShell action={createPolicy} cancelHref="/console/legal/insurance" submitLabel="Add policy">
          <Input label="Carrier" name="carrier" maxLength={160} placeholder="e.g. Lloyd's of London" required />
          <Input label="Policy Number" name="policy_no" maxLength={120} placeholder="e.g. LL-2025-00482" required />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Kind</label>
            <select name="kind" defaultValue="general_liability" className="input-base mt-1.5 w-full" required>
              <option value="general_liability">General Liability</option>
              <option value="motor">Motor</option>
              <option value="professional_indemnity">Professional Indemnity</option>
              <option value="event_cancellation">Event Cancellation</option>
              <option value="workers_compensation">Workers Compensation</option>
              <option value="property">Property</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Input label="Effective On" name="effective_on" type="date" />
          <Input label="Expires On" name="expires_on" type="date" />
        </FormShell>
      </div>
    </>
  );
}
