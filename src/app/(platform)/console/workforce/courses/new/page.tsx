import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createCourseAction, generateCourseAction } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.courses.new.eyebrow", undefined, "Training")}
        title={t("console.workforce.courses.new.title", undefined, "New Course")}
      />
      <div className="page-content max-w-2xl space-y-8">
        {/* AI generation — Connecteam-parity: generate full course from a single prompt */}
        <div className="surface rounded-xl p-6 border border-[var(--border)] space-y-4">
          <div>
            <p className="text-sm font-semibold">
              {t("console.workforce.courses.new.ai.heading", undefined, "Generate with AI")}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {t(
                "console.workforce.courses.new.ai.description",
                undefined,
                "Describe the topic and ATLVS AI will write the full outline, lessons, and quiz content.",
              )}
            </p>
          </div>
          <FormShell
            action={generateCourseAction}
            cancelHref="/console/workforce/courses"
            submitLabel={t("console.workforce.courses.new.ai.submit", undefined, "Generate Course")}
          >
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                {t("console.workforce.courses.new.ai.topicLabel", undefined, "What should the course cover?")}
              </label>
              <textarea
                name="topic"
                rows={3}
                maxLength={500}
                required
                placeholder={t(
                  "console.workforce.courses.new.ai.topicPlaceholder",
                  undefined,
                  "e.g. Rigging safety and load-bearing limits for stage structures",
                )}
                className="input-base mt-1.5 w-full"
              />
            </div>
          </FormShell>
        </div>

        <div className="flex items-center gap-3">
          <hr className="flex-1 border-[var(--border)]" />
          <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">
            {t("common.or", undefined, "or create manually")}
          </span>
          <hr className="flex-1 border-[var(--border)]" />
        </div>

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
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.workforce.courses.new.fields.summary", undefined, "Summary")}
            </label>
            <textarea name="summary" rows={3} maxLength={2000} className="input-base mt-1.5 w-full" />
          </div>
          <Input
            label={t("console.workforce.courses.new.fields.duration", undefined, "Duration (minutes)")}
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
      </div>
    </>
  );
}
