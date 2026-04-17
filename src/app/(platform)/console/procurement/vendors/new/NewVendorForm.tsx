"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createVendorAction } from "../actions";

export function NewVendorForm() {
  return (
    <FormShell action={createVendorAction} cancelHref="/console/procurement/vendors" submitLabel="Create vendor">
      <Input label="Name" name="name" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Email" name="contact_email" type="email" />
        <Input label="Phone" name="contact_phone" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Category" name="category" placeholder="Staging, lighting, catering…" />
        <Input label="COI expires" name="coi_expires_at" type="date" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="w9" /> W-9 on file
      </label>
    </FormShell>
  );
}
