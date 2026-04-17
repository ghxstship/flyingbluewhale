"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createFabAction } from "../actions";

export function NewFabForm() {
  return (
    <FormShell action={createFabAction} cancelHref="/console/production/fabrication" submitLabel="Create order">
      <Input label="Title" name="title" required />
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
        <textarea name="description" rows={3} className="input-base mt-1.5 w-full" />
      </div>
      <Input label="Due" name="due_at" type="date" />
    </FormShell>
  );
}
