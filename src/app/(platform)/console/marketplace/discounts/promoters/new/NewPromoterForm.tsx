"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { PROMOTER_STATES, PROMOTER_STATE_LABELS } from "@/lib/discounts_promoters";
import { createPromoterAction } from "../actions";

export function NewPromoterForm() {
  return (
    <FormShell
      action={createPromoterAction}
      cancelHref="/console/marketplace/discounts/promoters"
      submitLabel="Create Promoter"
    >
      <Input label="Name" name="name" required maxLength={160} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Email" name="email" type="email" />
        <Input label="Ref code" name="ref_code" maxLength={60} placeholder="DJNOVA" className="font-mono" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Commission (bps)"
          name="commission_bps"
          type="number"
          min={0}
          max={10000}
          defaultValue={1000}
          required
          hint="Basis points (1500 = 15%)."
        />
        <div>
          <label htmlFor="promoter_state" className="text-xs font-medium text-[var(--p-text-2)]">State</label>
          <select id="promoter_state" name="promoter_state" defaultValue="active" className="ps-input mt-1.5 w-full">
            {PROMOTER_STATES.map((s) => (
              <option key={s} value={s}>
                {PROMOTER_STATE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="notes" className="text-xs font-medium text-[var(--p-text-2)]">Notes</label>
        <textarea id="notes" name="notes" rows={3} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
