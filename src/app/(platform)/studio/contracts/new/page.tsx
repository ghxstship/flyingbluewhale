import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { NewContractForm } from "./NewContractForm";

export const dynamic = "force-dynamic";

export default async function NewContractPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.contracts.eyebrow", undefined, "Procurement")}
        title={t("console.contracts.new.title", undefined, "New Contract")}
      />
      <div className="page-content max-w-2xl">
        <NewContractForm />
      </div>
    </>
  );
}
