"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import type { Assessment } from "@/lib/legend_learning";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { State } from "./actions";

export function AssessmentForm({
  action,
  assessment,
  submitLabel,
  cancelHref,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  assessment?: Assessment;
  submitLabel: string;
  cancelHref: string;
}) {
  const t = useT();
  return (
    <FormShell action={action} cancelHref={cancelHref} submitLabel={submitLabel}>
      <Input
        label={t("console.legend.teach.assessmentForm.title", undefined, "Title")}
        name="title"
        required
        maxLength={160}
        defaultValue={assessment?.title ?? ""}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.legend.teach.assessmentForm.passPct", undefined, "Pass threshold (%)")}
          name="pass_pct"
          type="number"
          min={0}
          max={100}
          required
          defaultValue={String(assessment?.pass_pct ?? 70)}
        />
        <Input
          label={t("console.legend.teach.assessmentForm.maxAttempts", undefined, "Max attempts")}
          name="max_attempts"
          type="number"
          min={1}
          max={100}
          defaultValue={assessment?.max_attempts != null ? String(assessment.max_attempts) : ""}
          hint={t("console.legend.teach.assessmentForm.maxAttemptsHint", undefined, "Leave blank for unlimited attempts.")}
        />
      </div>
    </FormShell>
  );
}
