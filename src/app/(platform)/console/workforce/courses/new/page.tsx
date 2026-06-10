import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { NewCourseForm } from "./NewCourseForm";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.courses.new.eyebrow", undefined, "Training")}
        title={t("console.workforce.courses.new.title", undefined, "New Course")}
      />
      <div className="page-content max-w-2xl">
        <NewCourseForm />
      </div>
    </>
  );
}
