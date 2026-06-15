import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { createCourseAction } from "./actions";
import { CourseNewForm } from "./CourseNewForm";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.courses.new.eyebrow", undefined, "Training")}
        title={t("console.workforce.courses.new.title", undefined, "New Course")}
      />
      <div className="page-content max-w-2xl">
        <CourseNewForm
          action={createCourseAction}
          submitLabel={t("console.workforce.courses.new.submit", undefined, "Create Course")}
          titleLabel={t("console.workforce.courses.new.fields.title", undefined, "Title")}
          summaryLabel={t("console.workforce.courses.new.fields.summary", undefined, "Summary")}
          durationLabel={t("console.workforce.courses.new.fields.duration", undefined, "Duration — Minutes")}
          durationHint={t(
            "console.workforce.courses.new.fields.durationHint",
            undefined,
            "Estimate; shown to the assignee on /m/learning.",
          )}
          requiredForRoleLabel={t(
            "console.workforce.courses.new.fields.requiredForRole",
            undefined,
            "Required for role",
          )}
        />
      </div>
    </>
  );
}
