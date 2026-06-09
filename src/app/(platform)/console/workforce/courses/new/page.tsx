import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createCourseAction } from "./actions";
import { AiGeneratePanel } from "./AiGeneratePanel";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.courses.new.eyebrow", undefined, "Training")}
        title={t("console.workforce.courses.new.title", undefined, "New Course")}
      />
      <div className="page-content max-w-2xl space-y-5">
        {/* AI panel populates the form fields below via shared element IDs */}
        <AiGeneratePanel />

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
            id="course-title"
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
              id="course-summary"
            />
          </div>
          <Input
            label={t("console.workforce.courses.new.fields.duration", undefined, "Duration — Minutes")}
            name="duration_minutes"
            type="number"
            min="1"
            max="600"
            id="course-duration"
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
      </div>
    </>
  );
}
