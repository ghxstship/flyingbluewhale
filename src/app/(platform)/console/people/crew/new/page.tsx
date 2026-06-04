import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { NewCrewForm } from "./NewCrewForm";

export default async function NewCrewPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.people.crew.new.eyebrow", undefined, "People")}
        title={t("console.people.crew.new.title", undefined, "Add Crew Member")}
      />
      <div className="page-content max-w-xl">
        <NewCrewForm />
      </div>
    </>
  );
}
