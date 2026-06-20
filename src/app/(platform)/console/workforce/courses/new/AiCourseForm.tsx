"use client";

import { useState } from "react";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { AiCourseBuilder } from "@/components/workforce/AiCourseBuilder";
import type { AiCourseDraft } from "@/app/api/v1/courses/ai-draft/route";
import { createCourseAction } from "./actions";

export function AiCourseForm({ t }: { t: (key: string, vars?: Record<string, unknown>, fallback?: string) => string }) {
  const [draft, setDraft] = useState<AiCourseDraft | null>(null);

  return (
    <>
      <AiCourseBuilder onDraft={setDraft} />

      {draft && (
        <div className="surface rounded-lg p-4 mb-4 space-y-2 text-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-[var(--p-accent)]">AI Draft Preview</p>
          <p className="font-medium">{draft.title}</p>
          <p className="text-[var(--p-text-2)]">{draft.summary}</p>
          <ul className="list-disc list-inside text-[var(--p-text-2)] text-xs space-y-1">
            {draft.lessons.map((l, i) => (
              <li key={i}>{l.title}</li>
            ))}
          </ul>
          <p className="text-xs text-[var(--p-text-3)]">
            {draft.quiz_questions.length} quiz questions · {draft.duration_minutes} min
          </p>
        </div>
      )}

      <FormShell
        action={createCourseAction}
        cancelHref="/console/workforce/courses"
        submitLabel={t("console.workforce.courses.new.submit", undefined, "Create Course")}
      >
        <Input
          label={t("console.workforce.courses.new.fields.title", undefined, "Title")}
          name="title"
          required
          maxLength={200}
          defaultValue={draft?.title ?? ""}
        />
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.workforce.courses.new.fields.summary", undefined, "Summary")}
          </label>
          <textarea
            name="summary"
            rows={3}
            maxLength={2000}
            className="ps-input mt-1.5 w-full"
            defaultValue={draft?.summary ?? ""}
          />
        </div>
        <Input
          label={t("console.workforce.courses.new.fields.duration", undefined, "Duration — Minutes")}
          name="duration_minutes"
          type="number"
          min="1"
          max="600"
          defaultValue={draft?.duration_minutes?.toString() ?? ""}
          hint={t(
            "console.workforce.courses.new.fields.durationHint",
            undefined,
            "Estimate; shown to the assignee on /m/learning.",
          )}
        />
        <Input
          label={t("console.workforce.courses.new.fields.requiredForRole", undefined, "Required for role")}
          name="required_for_role"
          maxLength={80}
          defaultValue={draft?.required_for_role ?? ""}
        />
        {draft && (
          <input
            type="hidden"
            name="ai_draft_json"
            value={JSON.stringify(draft)}
          />
        )}
      </FormShell>
    </>
  );
}
