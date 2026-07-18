import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { fetchLookupOptions } from "@/lib/enum-lookup";
import { NewVendorForm } from "./NewVendorForm";

export default async function NewVendorPage() {
  const { t } = await getRequestT();
  // Active-only lookup options, ordered by sort_order (new-record form).
  const categoryOptions = await fetchLookupOptions("ref_vendor_category");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.vendors.new.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.vendors.new.title", undefined, "New Vendor")}
      />
      <div className="page-content max-w-xl">
        <NewVendorForm categoryOptions={categoryOptions} />
      </div>
    </>
  );
}
