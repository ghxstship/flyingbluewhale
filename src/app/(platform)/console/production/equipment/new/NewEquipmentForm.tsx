"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createEquipmentAction } from "../actions";

export function NewEquipmentForm() {
  return (
    <FormShell action={createEquipmentAction} cancelHref="/console/production/equipment" submitLabel="Add equipment">
      <Input label="Name" name="name" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Category" name="category" placeholder="Lighting, audio, video…" />
        <Input label="Asset tag" name="asset_tag" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Serial" name="serial" />
        <Input label="Daily rate (USD)" name="daily_rate" type="number" step="0.01" />
      </div>
    </FormShell>
  );
}
