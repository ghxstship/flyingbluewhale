"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createMileageAction } from "../actions";

export function NewMileageForm() {
  const today = new Date().toISOString().slice(0,10);
  return (
    <FormShell action={createMileageAction} cancelHref="/console/finance/mileage" submitLabel="Log mileage">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Origin" name="origin" required />
        <Input label="Destination" name="destination" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Miles" name="miles" type="number" step="0.1" required />
        <Input label="Date" name="logged_on" type="date" required defaultValue={today} />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Notes</label>
        <textarea name="notes" rows={2} className="input-base mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
