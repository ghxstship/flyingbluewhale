import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createMetric } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Sustainability · Carbon" title="New Measurement" />
      <div className="page-content max-w-xl">
        <FormShell action={createMetric} cancelHref="/console/sustainability/carbon" submitLabel="Record measurement">
          <Input label="Period Start" name="period_start" type="date" required />
          <Input label="Period End" name="period_end" type="date" required />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Scope</label>
            <select name="scope" defaultValue="1" className="input-base mt-1.5 w-full">
              <option value="1">Scope 1 — direct</option>
              <option value="2">Scope 2 — purchased energy</option>
              <option value="3">Scope 3 — value chain</option>
            </select>
          </div>
          <Input label="kg CO₂e" name="kg_co2e" type="number" min={0} step="0.01" defaultValue={0} required />
          <Input label="Source" name="source" maxLength={120} placeholder="e.g. Utility bill, Fleet log" />
          <Input label="Method" name="method" maxLength={120} placeholder="e.g. GHG Protocol, ISO 14064" />
        </FormShell>
      </div>
    </>
  );
}
