import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { NewReqForm } from "./NewReqForm";

export default async function NewReqPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.requisitions.new.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.requisitions.new.title", undefined, "New Requisition")}
      />
      <div className="page-content max-w-xl">
        <NewReqForm />
      </div>
    </>
  );
}
