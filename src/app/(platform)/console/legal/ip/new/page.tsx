import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createTrademark } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Legal · IP" title="New Trademark" />
      <div className="page-content max-w-xl">
        <FormShell action={createTrademark} cancelHref="/console/legal/ip" submitLabel="Register Mark">
          <Input label="Mark" name="mark" maxLength={160} placeholder="e.g. EVENTLY" required />
          <Input label="Jurisdiction" name="jurisdiction" maxLength={80} placeholder="e.g. US, EU, UK" />
          <Input label="Registration Number" name="registration_no" maxLength={120} placeholder="e.g. 6,123,456" />
          <Input label="Registered On" name="registered_on" type="date" />
          <Input label="Expires On" name="expires_on" type="date" />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Status</label>
            <select name="status" defaultValue="active" className="input-base mt-1.5 w-full">
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="opposed">Opposed</option>
              <option value="abandoned">Abandoned</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
