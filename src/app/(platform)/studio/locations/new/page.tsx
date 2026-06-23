import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { NewLocationForm } from "./NewLocationForm";

export default async function NewLocationPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.locations.new.eyebrow", undefined, "Work")}
        title={t("console.locations.new.title", undefined, "Add Location")}
      />
      <div className="page-content max-w-xl">
        <NewLocationForm />
      </div>
    </>
  );
}
