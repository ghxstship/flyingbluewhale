"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { BEO_LINE_SECTIONS, BEO_LINE_SECTION_LABELS } from "@/lib/beos";
import { addBeoLineAction } from "../actions";

export function AddBeoLineForm({ beoId }: { beoId: string }) {
  return (
    <FormShell action={addBeoLineAction} submitLabel="Add Line" className="space-y-4" dirtyGuard={false}>
      <input type="hidden" name="beo_id" value={beoId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="section" className="text-xs font-medium text-[var(--p-text-2)]">Section</label>
          <select id="section" name="section" className="ps-input mt-1.5 w-full" defaultValue="food_beverage">
            {BEO_LINE_SECTIONS.map((s) => (
              <option key={s} value={s}>
                {BEO_LINE_SECTION_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <Input label="Item name" name="name" required maxLength={200} />
      </div>
      <Input label="Description" name="description" maxLength={2000} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Quantity" name="quantity" type="number" min={0} step="any" defaultValue={1} required />
        <Input label="Unit price ($)" name="unit_price" inputMode="decimal" placeholder="0.00" />
      </div>
    </FormShell>
  );
}
