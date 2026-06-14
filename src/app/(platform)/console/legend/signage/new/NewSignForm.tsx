"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import {
  SIGNAGE_STANDARDS,
  SIGNAGE_STANDARD_LABELS,
  SIGNAGE_CATEGORIES,
  SIGNAGE_CATEGORY_LABELS,
  SIGN_STATES,
  SIGN_STATE_LABELS,
} from "@/lib/legend_signage";
import { createSignAction } from "../actions";

export function NewSignForm() {
  return (
    <FormShell action={createSignAction} cancelHref="/console/legend/signage" submitLabel="Create Sign">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Code" name="code" required maxLength={60} placeholder="ISO-E001" />
        <Input label="Name" name="name" required maxLength={160} placeholder="Emergency exit" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-[var(--p-text-2)]">Standard</span>
          <select name="standard" defaultValue="iso7010" className="ps-input mt-1.5 w-full">
            {SIGNAGE_STANDARDS.map((s) => (
              <option key={s} value={s}>
                {SIGNAGE_STANDARD_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-[var(--p-text-2)]">Category</span>
          <select name="category" defaultValue="safe_condition" className="ps-input mt-1.5 w-full">
            {SIGNAGE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {SIGNAGE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Pictogram key"
          name="pictogram_key"
          required
          maxLength={120}
          placeholder="p-exit"
        />
        <Input label="Colorway" name="colorway" maxLength={80} placeholder="life-safety green" />
      </div>
      <label className="block">
        <span className="text-xs font-medium text-[var(--p-text-2)]">State</span>
        <select name="sign_state" defaultValue="draft" className="ps-input mt-1.5 w-full">
          {SIGN_STATES.map((s) => (
            <option key={s} value={s}>
              {SIGN_STATE_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-medium text-[var(--p-text-2)]">Notes</span>
        <textarea name="notes" rows={3} className="ps-input mt-1.5 w-full" />
      </label>
    </FormShell>
  );
}
