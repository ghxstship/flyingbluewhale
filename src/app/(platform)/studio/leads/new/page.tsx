import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { NewLeadForm } from "./NewLeadForm";

export default async function NewLeadPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.leads.new.eyebrow", undefined, "Sales")}
        title={t("console.leads.new.title", undefined, "New Lead")}
      />
      <div className="page-content max-w-2xl">
        <NewLeadForm />
      </div>
    </>
  );
}
