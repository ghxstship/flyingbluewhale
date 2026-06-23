"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
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
  return (
    <FormShell action={action} cancelHref={`/studio/goals/${goalId}`} submitLabel={submitLabel}>
      <Input label="Title" name="title" required maxLength={200} defaultValue={keyResult?.title ?? ""} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Target"
          name="target_value"
          type="number"
          step="any"
          required
          defaultValue={keyResult ? String(keyResult.target_value) : ""}
        />
        <Input
          label="Current"
          name="current_value"
          type="number"
          step="any"
          required
          defaultValue={keyResult ? String(keyResult.current_value) : "0"}
        />
        <Input
          label="Unit"
          name="unit"
          maxLength={40}
          defaultValue={keyResult?.unit ?? ""}
          hint="e.g. %, $, signups"
        />
      </div>

      <div>
        <label htmlFor="kr_state" className="text-xs font-medium text-[var(--p-text-2)]">
          Health
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
