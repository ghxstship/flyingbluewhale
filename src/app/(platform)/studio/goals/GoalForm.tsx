"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
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
  const t = useT();
  return (
    <FormShell action={action} cancelHref="/studio/goals" submitLabel={submitLabel}>
      <Input
        label={t("console.goals.form.fields.title", undefined, "Title")}
        name="title"
        required
        maxLength={200}
        defaultValue={goal?.title ?? ""}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="owner_id" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.goals.form.fields.owner", undefined, "Owner")}
          </label>
          <select id="owner_id" name="owner_id" defaultValue={goal?.owner_id ?? ""} className="ps-input mt-1.5 w-full">
            <option value="">{t("console.goals.form.unassigned", undefined, "Unassigned")}</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <Input
          label={t("console.goals.form.fields.period", undefined, "Period")}
          name="period"
          maxLength={120}
          defaultValue={goal?.period ?? ""}
          hint={t("console.goals.form.hints.period", undefined, "Planning window, e.g. Q3 2026, FY26, H1.")}
        />
      </div>

      <div>
        <label htmlFor="goal_state" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.goals.form.fields.state", undefined, "State")}
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
          {t("console.goals.form.fields.description", undefined, "Description")}
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
