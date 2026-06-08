import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { GenerateForm } from "./GenerateForm";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.courses.generate.eyebrow", undefined, "Training")}
        title={t("console.workforce.courses.generate.title", undefined, "Generate Course with AI")}
        subtitle={t(
          "console.workforce.courses.generate.subtitle",
          undefined,
          "Describe what you want to teach and Claude will write the lessons and quiz.",
        )}
      />
      <div className="page-content max-w-2xl">
        <div className="surface p-6">
          <GenerateForm />
        </div>
      </div>
    </>
  );
}
