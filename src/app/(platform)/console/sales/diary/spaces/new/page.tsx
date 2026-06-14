import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { NewSpaceForm } from "./NewSpaceForm";

export default async function NewSpacePage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.diary.spaces.new.eyebrow", undefined, "Function Diary")}
        title={t("console.diary.spaces.new.title", undefined, "New Space")}
      />
      <div className="page-content max-w-2xl">
        <NewSpaceForm />
      </div>
    </>
  );
}
