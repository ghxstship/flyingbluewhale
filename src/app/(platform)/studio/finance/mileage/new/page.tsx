import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { NewMileageForm } from "./NewMileageForm";

export default async function NewMileagePage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.mileage.new.eyebrow", undefined, "Finance")}
        title={t("console.finance.mileage.new.title", undefined, "Log Mileage")}
      />
      <div className="page-content max-w-xl">
        <NewMileageForm />
      </div>
    </>
  );
}
