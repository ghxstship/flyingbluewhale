"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createRentalAction } from "../actions";

export function NewRentalForm({ equipment, projects }: { equipment: { id: string; name: string }[]; projects: { id: string; name: string }[] }) {
  return (
    <FormShell action={createRentalAction} cancelHref="/console/production/rentals" submitLabel="Reserve">
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Equipment</label>
        <select name="equipment_id" className="input-base mt-1.5 w-full" required>
          <option value="">Select equipment</option>
          {equipment.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Starts" name="starts_at" type="datetime-local" required />
        <Input label="Ends" name="ends_at" type="datetime-local" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Project</label>
          <select name="project_id" className="input-base mt-1.5 w-full">
            <option value="">— No project —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <Input label="Rate (USD)" name="rate" type="number" step="0.01" />
      </div>
    </FormShell>
  );
}
