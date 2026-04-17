"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createBudgetAction } from "../actions";

export function NewBudgetForm() {
  return (
    <FormShell action={createBudgetAction} cancelHref="/console/finance/budgets" submitLabel="Create budget">
      <Input label="Name" name="name" required maxLength={120} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Amount (USD)" name="amount" type="number" inputMode="decimal" step="0.01" required />
        <Input label="Category" name="category" />
      </div>
    </FormShell>
  );
}
