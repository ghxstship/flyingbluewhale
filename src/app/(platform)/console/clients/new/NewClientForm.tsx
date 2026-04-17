"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createClientAction } from "../actions";

export function NewClientForm() {
  return (
    <FormShell action={createClientAction} cancelHref="/console/clients" submitLabel="Create client">
      <Input label="Name" name="name" required maxLength={120} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Email" name="contact_email" type="email" />
        <Input label="Phone" name="contact_phone" />
      </div>
      <Input label="Website" name="website" type="url" placeholder="https://" />
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Notes</label>
        <textarea name="notes" rows={3} className="input-base mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
