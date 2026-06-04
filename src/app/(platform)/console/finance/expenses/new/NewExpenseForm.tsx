"use client";

import { useState } from "react";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { AtomPicker } from "@/components/xpms/AtomPicker";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createExpenseAction } from "../actions";

export type ExpenseAtomOption = {
  id: string;
  identifier: string;
  name: string;
  project_id: string;
  project_name: string | null;
};

export function NewExpenseForm({
  projects,
  atoms,
}: {
  projects: { id: string; name: string }[];
  atoms: ExpenseAtomOption[];
}) {
  const t = useT();
  const [projectId, setProjectId] = useState<string>("");
  const scoped = projectId ? atoms.filter((a) => a.project_id === projectId) : [];
  return (
    <FormShell
      action={createExpenseAction}
      cancelHref="/console/finance/expenses"
      submitLabel={t("console.finance.expenses.new.submit", undefined, "Log Expense")}
    >
      <Input
        label={t("console.finance.expenses.new.description", undefined, "Description")}
        name="description"
        required
        maxLength={500}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.finance.expenses.new.amount", undefined, "Amount (USD)")}
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          required
        />
        <Input
          label={t("console.finance.expenses.new.date", undefined, "Date")}
          name="spent_at"
          type="date"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
        />
      </div>
      <Input
        label={t("console.finance.expenses.new.category", undefined, "Category")}
        name="category"
        placeholder={t("console.finance.expenses.new.categoryPlaceholder", undefined, "Travel, meals, equipment…")}
      />
      {projects.length > 0 && (
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">
            {t("console.finance.expenses.new.projectOptional", undefined, "Project (optional)")}
          </label>
          <select
            name="project_id"
            className="input-base mt-1.5 w-full"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">{t("console.finance.expenses.new.noProject", undefined, "— No project —")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {projectId && scoped.length > 0 && (
        <AtomPicker
          name="atom_id"
          atoms={scoped}
          hint={t(
            "console.finance.expenses.new.atomHint",
            undefined,
            "Pin this expense to a WBS atom for actual-cost rollup on the project Tracker.",
          )}
        />
      )}
    </FormShell>
  );
}
