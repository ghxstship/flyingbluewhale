import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader title={t("console.logistics.title", undefined, "Logistics")} />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="surface hover-lift p-4" href="/console/logistics/ratecard">
            <div className="text-sm font-medium">{t("console.logistics.rateCard", undefined, "Rate card")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/logistics/freight">
            <div className="text-sm font-medium">{t("console.logistics.freightLabel", undefined, "Freight")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/logistics/warehouse">
            <div className="text-sm font-medium">{t("console.logistics.warehouseLabel", undefined, "Warehouse")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/logistics/services">
            <div className="text-sm font-medium">{t("console.logistics.servicesLabel", undefined, "Services")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/logistics/disposition">
            <div className="text-sm font-medium">{t("console.logistics.dispositionLabel", undefined, "Disposition")}</div>
          </Link>
        </div>
      </div>
    </>
  );
}
