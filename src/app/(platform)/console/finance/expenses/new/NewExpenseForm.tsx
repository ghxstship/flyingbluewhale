"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createExpenseAction } from "../actions";

export function NewExpenseForm() {
  return (
    <FormShell action={createExpenseAction} cancelHref="/console/finance/expenses" submitLabel="Log expense">
      <Input label="Description" name="description" required maxLength={500} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Amount (USD)" name="amount" type="number" inputMode="decimal" step="0.01" required />
        <Input label="Date" name="spent_at" type="date" required defaultValue={new Date().toISOString().slice(0,10)} />
      </div>
      <Input label="Category" name="category" placeholder="Travel, meals, equipment…" />
    </FormShell>
  );
}
