"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createReqAction } from "../actions";

export function NewReqForm() {
  return (
    <FormShell action={createReqAction} cancelHref="/console/procurement/requisitions" submitLabel="Create requisition">
      <Input label="Title" name="title" required />
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
        <textarea name="description" rows={3} className="input-base mt-1.5 w-full" />
      </div>
      <Input label="Estimated cost (USD)" name="estimated" type="number" step="0.01" />
    </FormShell>
  );
}
