import { ModuleHeader } from "@/components/Shell";
import { NewSignForm } from "./NewSignForm";
import { getRequestT } from "@/lib/i18n/request";

export default async function NewSignPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.signage.eyebrow", undefined, "LEG3ND")}
        title={t("console.legend.signage.new.title", undefined, "New Sign")}
      />
      <div className="page-content max-w-2xl">
        <NewSignForm />
      </div>
    </>
  );
}
