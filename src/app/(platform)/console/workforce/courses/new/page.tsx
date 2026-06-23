import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createCourseAction } from "./actions";
import { GenerateCoursePanel } from "./GenerateCoursePanel";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.courses.new.eyebrow", undefined, "Training")}
        title={t("console.workforce.courses.new.title", undefined, "New Course")}
      />
      <div className="page-content max-w-2xl space-y-8">
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
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.workforce.courses.new.fields.summary", undefined, "Summary")}
            </label>
            <textarea name="summary" rows={3} maxLength={2000} className="ps-input mt-1.5 w-full" />
          </div>
          <Input
            label={t("console.workforce.courses.new.fields.duration", undefined, "Duration — Minutes")}
            name="duration_minutes"
            type="number"
            min="1"
            max="600"
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
          />
        </FormShell>

        <div className="relative">
          <div className="absolute inset-x-0 top-0 flex items-center">
            <div className="w-full border-t border-[var(--p-border)]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[var(--p-bg)] px-3 text-xs text-[var(--p-text-3)]">
              {t("console.workforce.courses.new.orGenerateWithAI", undefined, "or generate with AI")}
            </span>
          </div>
        </div>

        <div className="surface rounded-xl p-5">
          <div className="mb-3">
            <div className="text-[10px] font-mono text-[var(--p-text-3)] uppercase tracking-wider mb-0.5">
              {t("console.workforce.courses.new.aiCourseCreator", undefined, "AI Course Creator")}
            </div>
            <p className="text-xs text-[var(--p-text-2)]">
              {t(
                "console.workforce.courses.new.aiCourseCreatorHint",
                undefined,
                "Describe your topic and we'll generate a full course — lessons and quiz — in seconds.",
              )}
            </p>
          </div>
          <GenerateCoursePanel />
        </div>
      </div>
    </>
  );
}
