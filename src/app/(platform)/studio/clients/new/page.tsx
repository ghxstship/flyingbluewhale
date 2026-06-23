import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { NewClientForm } from "./NewClientForm";

export default async function NewClientPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.clients.new.eyebrow", undefined, "Sales")}
        title={t("console.clients.new.title", undefined, "New Client")}
      />
      <div className="page-content max-w-2xl">
        <NewClientForm />
      </div>
    </>
  );
}
