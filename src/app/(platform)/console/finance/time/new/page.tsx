import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { NewTimeEntryForm } from "./NewTimeEntryForm";

export default async function NewTimeEntryPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.time.new.eyebrow", undefined, "Finance")}
        title={t("console.finance.time.new.title", undefined, "Log Time")}
      />
      <div className="page-content max-w-xl">
        <NewTimeEntryForm />
      </div>
    </>
  );
}
