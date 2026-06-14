"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { GOAL_STATES, GOAL_STATE_LABELS, type Goal } from "@/lib/goals";
import type { State } from "./actions";

export type OwnerOption = { id: string; label: string };

export function GoalForm({
  action,
  owners,
  goal,
  submitLabel,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  owners: OwnerOption[];
  goal?: Goal;
  submitLabel: string;
}) {
  return (
    <FormShell action={action} cancelHref="/console/goals" submitLabel={submitLabel}>
      <Input label="Title" name="title" required maxLength={200} defaultValue={goal?.title ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="owner_id" className="text-xs font-medium text-[var(--p-text-2)]">
            Owner
          </label>
          <select id="owner_id" name="owner_id" defaultValue={goal?.owner_id ?? ""} className="ps-input mt-1.5 w-full">
            <option value="">Unassigned</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Period"
          name="period"
          maxLength={120}
          defaultValue={goal?.period ?? ""}
          hint="Planning window, e.g. Q3 2026, FY26, H1."
        />
      </div>

      <div>
        <label htmlFor="goal_state" className="text-xs font-medium text-[var(--p-text-2)]">
          State
        </label>
        <select
          id="goal_state"
          name="goal_state"
          defaultValue={goal?.goal_state ?? "draft"}
          className="ps-input mt-1.5 w-full"
        >
          {GOAL_STATES.map((s) => (
            <option key={s} value={s}>
              {GOAL_STATE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="text-xs font-medium text-[var(--p-text-2)]">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="ps-input mt-1.5 w-full"
          defaultValue={goal?.description ?? ""}
        />
      </div>
    </FormShell>
  );
}
