import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createThreat } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Safety" title="New Threat" />
      <div className="page-content max-w-xl">
        <FormShell action={createThreat} cancelHref="/console/safety/threats" submitLabel="Add Threat">
          <Input label="Code" name="code" maxLength={40} placeholder="THR-001" required />
          <Input label="Title" name="title" maxLength={200} placeholder="Short headline" required />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea
              name="description"
              rows={4}
              maxLength={5000}
              className="input-base mt-1.5 w-full"
              placeholder="Free-form context — distribution scoped by classification."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Severity</label>
            <select name="severity" defaultValue="medium" className="input-base mt-1.5 w-full" required>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Likelihood</label>
            <select name="likelihood" defaultValue="possible" className="input-base mt-1.5 w-full" required>
              <option value="rare">Rare</option>
              <option value="unlikely">Unlikely</option>
              <option value="possible">Possible</option>
              <option value="likely">Likely</option>
              <option value="almost_certain">Almost certain</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Treatment</label>
            <select name="treatment" defaultValue="mitigate" className="input-base mt-1.5 w-full">
              <option value="mitigate">Mitigate</option>
              <option value="accept">Accept</option>
              <option value="transfer">Transfer</option>
              <option value="avoid">Avoid</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Classification</label>
            <select name="classification" defaultValue="internal" className="input-base mt-1.5 w-full">
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
