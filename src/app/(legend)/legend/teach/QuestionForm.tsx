"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import type { AssessmentQuestion } from "@/lib/legend_learning";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { State } from "./actions";

export function QuestionForm({
  action,
  question,
  submitLabel,
  cancelHref,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  question?: AssessmentQuestion;
  submitLabel: string;
  cancelHref: string;
}) {
  const t = useT();
  return (
    <FormShell action={action} cancelHref={cancelHref} submitLabel={submitLabel}>
      <div>
        <label htmlFor="prompt" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.legend.teach.questionForm.prompt", undefined, "Prompt")}
        </label>
        <textarea
          id="prompt"
          name="prompt"
          rows={2}
          required
          maxLength={1000}
          className="ps-input mt-1.5 w-full"
          defaultValue={question?.prompt ?? ""}
        />
      </div>
      <div>
        <label htmlFor="options" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.legend.teach.questionForm.options", undefined, "Options (one per line)")}
        </label>
        <textarea
          id="options"
          name="options"
          rows={4}
          required
          maxLength={4000}
          className="ps-input mt-1.5 w-full"
          defaultValue={(question?.options ?? []).join("\n")}
        />
        <p className="mt-1 text-xs text-[var(--p-text-3)]">
          {t("console.legend.teach.questionForm.optionsHint", undefined, "At least two answer options, one per line.")}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.legend.teach.questionForm.correctIndex", undefined, "Correct option (number, starting at 1)")}
          name="correct_number"
          type="number"
          min={1}
          required
          defaultValue={String((question?.correct_index ?? 0) + 1)}
        />
        <Input
          label={t("console.legend.teach.questionForm.points", undefined, "Points")}
          name="points"
          type="number"
          min={1}
          max={100}
          required
          defaultValue={String(question?.points ?? 1)}
        />
      </div>
    </FormShell>
  );
}
