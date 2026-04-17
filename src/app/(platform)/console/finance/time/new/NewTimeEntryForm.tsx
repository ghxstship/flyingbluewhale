"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createTimeEntryAction } from "../actions";

export function NewTimeEntryForm() {
  const now = new Date();
  const iso = now.toISOString().slice(0,16);
  return (
    <FormShell action={createTimeEntryAction} cancelHref="/console/finance/time" submitLabel="Log time">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Started" name="started_at" type="datetime-local" required defaultValue={iso} />
        <Input label="Ended" name="ended_at" type="datetime-local" />
      </div>
      <Input label="Description" name="description" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="billable" defaultChecked /> Billable
      </label>
    </FormShell>
  );
}
