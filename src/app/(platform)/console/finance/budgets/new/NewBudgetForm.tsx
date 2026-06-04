"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createBudgetAction } from "../actions";

export function NewBudgetForm() {
  const t = useT();
  return (
    <FormShell
      action={createBudgetAction}
      cancelHref="/console/finance/budgets"
      submitLabel={t("console.finance.budgets.new.submit", undefined, "Create Budget")}
    >
      <Input label={t("console.finance.budgets.new.name", undefined, "Name")} name="name" required maxLength={120} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.finance.budgets.new.amount", undefined, "Amount (USD)")}
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          required
        />
        <Input label={t("console.finance.budgets.new.category", undefined, "Category")} name="category" />
      </div>
    </FormShell>
  );
}
