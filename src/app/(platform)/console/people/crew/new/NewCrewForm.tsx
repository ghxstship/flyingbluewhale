"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createCrewAction } from "../actions";

export function NewCrewForm() {
  return (
    <FormShell action={createCrewAction} cancelHref="/console/people/crew" submitLabel="Add crew">
      <Input label="Name" name="name" required />
      <Input label="Role" name="role" placeholder="Gaffer, rigger, audio engineer…" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Email" name="email" type="email" />
        <Input label="Phone" name="phone" />
      </div>
      <Input label="Day rate (USD)" name="day_rate" type="number" step="0.01" />
    </FormShell>
  );
}
