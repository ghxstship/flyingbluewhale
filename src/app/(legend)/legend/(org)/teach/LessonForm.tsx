"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { LESSON_KINDS, LESSON_KIND_LABELS, type Lesson } from "@/lib/legend_learning";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { State } from "./actions";

export function LessonForm({
  action,
  lesson,
  submitLabel,
  cancelHref,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  lesson?: Lesson;
  submitLabel: string;
  cancelHref: string;
}) {
  const t = useT();
  return (
    <FormShell action={action} cancelHref={cancelHref} submitLabel={submitLabel}>
      <Input
        label={t("console.legend.teach.lessonForm.title", undefined, "Title")}
        name="title"
        required
        maxLength={160}
        defaultValue={lesson?.title ?? ""}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="kind" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.legend.teach.lessonForm.kind", undefined, "Kind")}
          </label>
          <select id="kind" name="kind" defaultValue={lesson?.kind ?? "article"} className="ps-input mt-1.5 w-full">
            {LESSON_KINDS.map((k) => (
              <option key={k} value={k}>
                {LESSON_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <Input
          label={t("console.legend.teach.lessonForm.duration", undefined, "Duration (minutes)")}
          name="duration_minutes"
          type="number"
          min={0}
          max={6000}
          defaultValue={String(Math.round((lesson?.duration_seconds ?? 0) / 60))}
        />
      </div>
      <Input
        label={t("console.legend.teach.lessonForm.mediaUrl", undefined, "Media URL")}
        name="media_url"
        type="url"
        placeholder="https://"
        defaultValue={lesson?.media_url ?? ""}
        hint={t(
          "console.legend.teach.lessonForm.mediaUrlHint",
          undefined,
          "Stream URL for video/audio lessons. Article lessons can leave this blank.",
        )}
      />
      <div>
        <label htmlFor="body_html" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.legend.teach.lessonForm.body", undefined, "Lesson body")}
        </label>
        <textarea
          id="body_html"
          name="body_html"
          rows={10}
          className="ps-input mt-1.5 w-full font-mono text-xs"
          defaultValue={lesson?.body_html ?? ""}
        />
        <p className="mt-1 text-xs text-[var(--p-text-3)]">
          {t(
            "console.legend.teach.lessonForm.bodyHint",
            undefined,
            "HTML content rendered to the learner exactly as the seed lessons are.",
          )}
        </p>
      </div>
    </FormShell>
  );
}
