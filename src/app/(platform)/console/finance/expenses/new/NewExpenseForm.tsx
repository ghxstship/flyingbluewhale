"use client";

import { useState } from "react";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { AtomPicker } from "@/components/xpms/AtomPicker";
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
  const [projectId, setProjectId] = useState<string>("");
  const scoped = projectId ? atoms.filter((a) => a.project_id === projectId) : [];
  return (
    <FormShell action={createExpenseAction} cancelHref="/console/finance/expenses" submitLabel="Log Expense">
      <Input label="Description" name="description" required maxLength={500} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Amount (USD)" name="amount" type="number" inputMode="decimal" step="0.01" required />
        <Input label="Date" name="spent_at" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
      </div>
      <Input label="Category" name="category" placeholder="Travel, meals, equipment…" />
      {projects.length > 0 && (
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Project (optional)</label>
          <select
            name="project_id"
            className="input-base mt-1.5 w-full"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">— No project —</option>
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
          hint="Pin this expense to a WBS atom for actual-cost rollup on the project Tracker."
        />
      )}
    </FormShell>
  );
}
