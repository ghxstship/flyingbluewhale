import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { AiCourseForm } from "./AiCourseForm";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.courses.new.eyebrow", undefined, "Training")}
        title={t("console.workforce.courses.new.title", undefined, "New Course")}
        subtitle={t(
          "console.workforce.courses.new.subtitle",
          undefined,
          "Build manually or generate a full outline with AI.",
        )}
      />
      <div className="page-content max-w-2xl">
        <AiCourseForm t={t} />
      </div>
    </>
  );
}
