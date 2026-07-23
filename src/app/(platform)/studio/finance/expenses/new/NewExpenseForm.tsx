"use client";

import { useState } from "react";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { AtomPicker } from "@/components/xpms/AtomPicker";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createExpenseAction } from "../actions";
import { XPMS_DEPARTMENTS, XPMS_DISCIPLINES, XPMS_PHASES } from "@/lib/finance/xpms-budget";

const SELECT_CLASS = "ps-input w-full";

function XpmsSelect({ label, name, options }: { label: string; name: string; options: readonly string[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">{label}</span>
      <select name={name} className={SELECT_CLASS} defaultValue="">
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

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
      cancelHref="/studio/finance/expenses"
      submitLabel={t("console.finance.expenses.new.submit", undefined, "Log Expense")}
    >
      <Input
        label={t("console.finance.expenses.new.description", undefined, "Description")}
        name="description"
        required
        maxLength={500}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <MoneyInput
          label={t("console.finance.expenses.new.amount", undefined, "Amount (USD)")}
          name="amount_cents"
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
      {/* XPMS taxonomy — typed enums first, free-text category last
          for legacy compatibility. The expenses-rollup trigger keys
          off department + project_id to write into budgets.actual_cents. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <XpmsSelect
          label={t("console.finance.expenses.new.department", undefined, "Department (XPMS)")}
          name="department"
          options={XPMS_DEPARTMENTS}
        />
        <XpmsSelect
          label={t("console.finance.expenses.new.discipline", undefined, "Discipline")}
          name="discipline"
          options={XPMS_DISCIPLINES}
        />
        <XpmsSelect
          label={t("console.finance.expenses.new.phase", undefined, "Phase (8-Gate)")}
          name="xpms_phase"
          options={XPMS_PHASES}
        />
        <Input label={t("console.finance.expenses.new.item", undefined, "Item")} name="item" maxLength={120} />
        <Input label={t("console.finance.expenses.new.vendor", undefined, "Vendor")} name="vendor" maxLength={160} />
        {/* `category` retired on studio expenses — superseded by XPMS
            department/discipline (above). Mobile field capture keeps a
            lookup-backed category; see docs/schema/enum-ui-enrichment-2026-07-18.md. */}
      </div>
      {projects.length > 0 && (
        <div>
          <label htmlFor="project_id" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.finance.expenses.new.projectOptional", undefined, "Project · Optional")}
          </label>
          <select id="project_id"
            name="project_id"
            className="ps-input mt-1.5 w-full"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">{t("console.finance.expenses.new.noProject", undefined, "No project")}</option>
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
