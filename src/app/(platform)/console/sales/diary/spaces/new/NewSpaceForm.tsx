"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { SPACE_STATES, SPACE_STATE_LABELS } from "@/lib/function_diary";
import { createSpaceAction } from "../../actions";

export function NewSpaceForm() {
  const t = useT();
  return (
    <FormShell
      action={createSpaceAction}
      cancelHref="/console/sales/diary/spaces"
      submitLabel={t("console.diary.spaces.new.submit", undefined, "Create Space")}
    >
      <Input
        label={t("console.diary.spaces.field.name", undefined, "Name")}
        name="name"
        required
        maxLength={200}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t("console.diary.spaces.field.venue", undefined, "Venue")} name="venue" maxLength={200} />
        <Input
          label={t("console.diary.spaces.field.capacity", undefined, "Capacity")}
          name="capacity"
          type="number"
          min={0}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.diary.spaces.field.state", undefined, "State")}
        </label>
        <select name="space_state" defaultValue="active" className="ps-input mt-1.5 w-full">
          {SPACE_STATES.map((s) => (
            <option key={s} value={s}>
              {SPACE_STATE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.diary.spaces.field.notes", undefined, "Notes")}
        </label>
        <textarea name="notes" rows={3} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
