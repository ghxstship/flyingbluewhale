"use client";

import { useActionState } from "react";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createCourseAction } from "./actions";

type Props = { onSwitch: () => void };

export function ManualCourseForm({ onSwitch }: Props) {
  const [, formAction, pending] = useActionState(createCourseAction, null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-muted)]">Fill in details manually.</p>
        <button
          type="button"
          onClick={onSwitch}
          className="text-xs text-[var(--text-muted)] underline underline-offset-2 hover:text-[var(--text-primary)]"
        >
          Use AI Builder instead
        </button>
      </div>
      <FormShell action={formAction} cancelHref="/console/workforce/courses" submitLabel="Create Course">
        <Input label="Title" name="title" required maxLength={200} />
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Summary</label>
          <textarea name="summary" rows={3} maxLength={2000} className="input-base mt-1.5 w-full" />
        </div>
        <Input
          label="Duration (minutes)"
          name="duration_minutes"
          type="number"
          min="1"
          max="600"
          hint="Estimate; shown to the assignee on /m/learning."
        />
        <Input label="Required for role" name="required_for_role" maxLength={80} />
      </FormShell>
    </div>
  );
}
