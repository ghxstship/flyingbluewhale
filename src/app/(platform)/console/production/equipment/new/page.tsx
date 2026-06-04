import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { NewEquipmentForm } from "./NewEquipmentForm";

export default async function NewEquipmentPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.equipment.new.eyebrow", undefined, "Production")}
        title={t("console.production.equipment.new.title", undefined, "Add Equipment")}
      />
      <div className="page-content max-w-xl">
        <NewEquipmentForm />
      </div>
    </>
  );
}
