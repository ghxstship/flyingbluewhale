"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createAdvanceAction } from "../actions";

export function NewAdvanceForm() {
  return (
    <FormShell action={createAdvanceAction} cancelHref="/console/finance/advances" submitLabel="Submit request">
      <Input label="Amount (USD)" name="amount" type="number" step="0.01" required />
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Reason</label>
        <textarea name="reason" rows={3} className="input-base mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
