import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createSafeguardingReport } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Safety · Safeguarding" title="File Report" />
      <div className="page-content max-w-xl">
        <FormShell
          action={createSafeguardingReport}
          cancelHref="/console/safety/safeguarding"
          submitLabel="File report"
        >
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Narrative</label>
            <textarea name="narrative" rows={6} maxLength={5000} className="input-base mt-1.5 w-full" required />
          </div>
          <Input label="Subject Reference" name="subject_ref" maxLength={120} placeholder="Pseudonymous ID" />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Status</label>
            <select name="status" defaultValue="received" className="input-base mt-1.5 w-full">
              <option value="received">Received</option>
              <option value="triage">Triage</option>
              <option value="under_review">Under review</option>
              <option value="referred">Referred</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
