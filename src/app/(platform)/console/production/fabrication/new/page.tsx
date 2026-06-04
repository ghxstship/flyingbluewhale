import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { NewFabForm } from "./NewFabForm";

export default async function NewFabPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.fabrication.new.eyebrow", undefined, "Production")}
        title={t("console.production.fabrication.new.title", undefined, "New Fabrication Order")}
      />
      <div className="page-content max-w-xl">
        <NewFabForm />
      </div>
    </>
  );
}
