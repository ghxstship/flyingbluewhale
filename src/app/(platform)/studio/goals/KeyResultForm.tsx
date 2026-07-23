"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { KR_STATES, KR_STATE_LABELS, type KeyResult } from "@/lib/goals";
import type { State } from "./actions";

export function KeyResultForm({
  action,
  goalId,
  keyResult,
  submitLabel,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  goalId: string;
  keyResult?: KeyResult;
  submitLabel: string;
}) {
  const t = useT();
  return (
    <FormShell action={action} cancelHref={`/studio/goals/${goalId}`} submitLabel={submitLabel}>
      <Input
        label={t("console.goals.krForm.fields.title", undefined, "Title")}
        name="title"
        required
        maxLength={200}
        defaultValue={keyResult?.title ?? ""}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label={t("console.goals.krForm.fields.target", undefined, "Target")}
          name="target_value"
          type="number"
          step="any"
          required
          defaultValue={keyResult ? String(keyResult.target_value) : ""}
        />
        <Input
          label={t("console.goals.krForm.fields.current", undefined, "Current")}
          name="current_value"
          type="number"
          step="any"
          required
          defaultValue={keyResult ? String(keyResult.current_value) : "0"}
        />
        <Input
          label={t("console.goals.krForm.fields.unit", undefined, "Unit")}
          name="unit"
          maxLength={40}
          defaultValue={keyResult?.unit ?? ""}
          hint={t("console.goals.krForm.hints.unit", undefined, "e.g. %, $, signups")}
        />
      </div>

      <div>
        <label htmlFor="kr_state" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.goals.krForm.fields.health", undefined, "Health")}
        </label>
        <select
          id="kr_state"
          name="kr_state"
          defaultValue={keyResult?.kr_state ?? "on_track"}
          className="ps-input mt-1.5 w-full"
        >
          {KR_STATES.map((s) => (
            <option key={s} value={s}>
              {KR_STATE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
    </FormShell>
  );
}
