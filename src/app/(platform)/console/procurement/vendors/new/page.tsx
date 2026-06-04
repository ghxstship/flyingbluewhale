import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { NewVendorForm } from "./NewVendorForm";

export default async function NewVendorPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.vendors.new.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.vendors.new.title", undefined, "New Vendor")}
      />
      <div className="page-content max-w-xl">
        <NewVendorForm />
      </div>
    </>
  );
}
