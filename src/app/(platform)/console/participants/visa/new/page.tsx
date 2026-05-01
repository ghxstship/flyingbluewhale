import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createVisaCase } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Participants · Visa" title="New Visa Case" />
      <div className="page-content max-w-xl">
        <FormShell action={createVisaCase} cancelHref="/console/participants/visa" submitLabel="Open Case">
          <Input label="Person Name" name="person_name" maxLength={160} placeholder="As on passport" required />
          <Input label="Nationality" name="nationality" maxLength={80} placeholder="ISO-3166 name" />
          <Input label="Passport Number" name="passport_no" maxLength={60} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Status</label>
            <select name="status" defaultValue="open" className="input-base mt-1.5 w-full">
              <option value="open">Open</option>
              <option value="invitation_letter">Invitation letter sent</option>
              <option value="application_filed">Application filed</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
