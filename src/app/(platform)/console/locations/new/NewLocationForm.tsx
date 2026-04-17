"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createLocationAction } from "../actions";

export function NewLocationForm() {
  return (
    <FormShell action={createLocationAction} cancelHref="/console/locations" submitLabel="Save location">
      <Input label="Name" name="name" required />
      <Input label="Address" name="address" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="City" name="city" />
        <Input label="Region" name="region" />
        <Input label="Postal code" name="postcode" />
      </div>
      <Input label="Country" name="country" />
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Notes</label>
        <textarea name="notes" rows={2} className="input-base mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
