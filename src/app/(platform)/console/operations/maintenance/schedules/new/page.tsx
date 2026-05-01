import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createSchedule } from "./actions";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Operations · Maintenance" title="New Schedule" />
      <div className="page-content max-w-xl">
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Author a recurring inspection / service / compliance check. The first job is materialised immediately; further
          jobs are spawned at each cadence interval.
        </p>
        <FormShell action={createSchedule} cancelHref="/console/operations/maintenance" submitLabel="Create Schedule">
          <Input label="Name" name="name" maxLength={160} placeholder="e.g. Scaffold load check — Stage A" required />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Kind</label>
            <select name="kind" defaultValue="inspection" className="input-base mt-1.5 w-full" required>
              <option value="inspection">Inspection (safety walk, scaffold check)</option>
              <option value="service">Service (pre-show diagnostic, calibration)</option>
              <option value="cert_renewal">Cert renewal (re-issuance, re-test)</option>
              <option value="compliance">Compliance (audit, regulator submission)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Target kind</label>
            <select name="target_kind" defaultValue="venue" className="input-base mt-1.5 w-full" required>
              <option value="venue">Venue</option>
              <option value="equipment">Equipment</option>
              <option value="credential">Credential</option>
              <option value="workforce">Workforce member</option>
              <option value="custom">Custom (no target binding)</option>
            </select>
          </div>
          <Input
            label="Target ID (Optional)"
            name="target_id"
            placeholder="Paste a venue/equipment/credential id, or leave blank"
          />
          <Input
            label="Cadence (days between runs)"
            name="cadence_days"
            type="number"
            min={1}
            max={3650}
            defaultValue={7}
            required
          />
        </FormShell>
      </div>
    </>
  );
}
