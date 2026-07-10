import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { NewPoForm } from "./NewPoForm";

export const dynamic = "force-dynamic";

export default async function NewPOPage() {
  const { t } = await getRequestT();
  // FK candidates (vendors, projects) are searched on demand through
  // RecordCombobox (audit A-06) — no preloaded capped dump.
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.purchaseOrders.new.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.purchaseOrders.new.title", undefined, "New Purchase Order")}
      />
      <div className="page-content max-w-xl">
        <NewPoForm />
      </div>
    </>
  );
}
