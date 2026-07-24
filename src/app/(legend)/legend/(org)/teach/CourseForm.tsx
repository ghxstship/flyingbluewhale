"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import type { Course } from "@/lib/legend_learning";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { State } from "./actions";

export function CourseForm({
  action,
  course,
  certifications,
  submitLabel,
  cancelHref,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  course?: Course;
  certifications: Array<{ id: string; name: string }>;
  submitLabel: string;
  cancelHref: string;
}) {
  const t = useT();
  return (
    <FormShell action={action} cancelHref={cancelHref} submitLabel={submitLabel}>
      <Input
        label={t("console.legend.teach.form.title", undefined, "Title")}
        name="title"
        required
        maxLength={160}
        defaultValue={course?.title ?? ""}
      />
      <div>
        <label htmlFor="summary" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.legend.teach.form.summary", undefined, "Summary")}
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={3}
          maxLength={2000}
          className="ps-input mt-1.5 w-full"
          defaultValue={course?.summary ?? ""}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.legend.teach.form.coverPath", undefined, "Cover path")}
          name="cover_path"
          maxLength={500}
          defaultValue={course?.cover_path ?? ""}
          hint={t(
            "console.legend.teach.form.coverPathHint",
            undefined,
            "Text pointer to an already-stored image. File uploads are out of scope.",
          )}
        />
        <Input
          label={t("console.legend.teach.form.pointsReward", undefined, "Points reward")}
          name="points_reward"
          type="number"
          min={0}
          max={100000}
          defaultValue={String(course?.points_reward ?? 0)}
          hint={t("console.legend.teach.form.pointsRewardHint", undefined, "Arena points awarded on completion.")}
        />
      </div>
      <div>
        <label htmlFor="grants_certification_id" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.legend.teach.form.certification", undefined, "Grants certification")}
        </label>
        <select
          id="grants_certification_id"
          name="grants_certification_id"
          defaultValue={course?.grants_certification_id ?? ""}
          className="ps-input mt-1.5 w-full"
        >
          <option value="">{t("console.legend.teach.form.noCertification", undefined, "None")}</option>
          {certifications.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[var(--p-text-3)]">
          {t(
            "console.legend.teach.form.certificationHint",
            undefined,
            "Issued automatically when a learner passes the published assessment.",
          )}
        </p>
      </div>
    </FormShell>
  );
}
