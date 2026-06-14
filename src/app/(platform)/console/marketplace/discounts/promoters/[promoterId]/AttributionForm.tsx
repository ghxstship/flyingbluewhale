"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createAttributionAction } from "../actions";

export function AttributionForm({ promoterId }: { promoterId: string }) {
  const action = createAttributionAction.bind(null, promoterId);
  return (
    <FormShell action={action} submitLabel="Record" dirtyGuard={false}>
      <Input
        label="Transaction reference"
        name="transaction_ref"
        required
        maxLength={200}
        placeholder="order / invoice id"
        className="font-mono"
      />
      <Input
        label="Amount (cents)"
        name="amount_cents"
        type="number"
        min={0}
        required
        hint="Gross transaction amount in cents. Commission is captured at the promoter's current rate."
      />
      <div>
        <label htmlFor="notes" className="text-xs font-medium text-[var(--p-text-2)]">Notes</label>
        <textarea id="notes" name="notes" rows={2} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
