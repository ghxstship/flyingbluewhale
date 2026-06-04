import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader title={t("console.accreditation.title", undefined, "Accreditation")} />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="surface hover-lift p-4" href="/console/accreditation/policy">
            <div className="text-sm font-medium">{t("console.accreditation.policy", undefined, "Policy")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/accreditation/categories">
            <div className="text-sm font-medium">{t("console.accreditation.categories", undefined, "Categories")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/accreditation/zones">
            <div className="text-sm font-medium">{t("console.accreditation.zones", undefined, "Zones")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/accreditation/vetting">
            <div className="text-sm font-medium">{t("console.accreditation.vetting", undefined, "Vetting")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/accreditation/print">
            <div className="text-sm font-medium">{t("console.accreditation.printQueue", undefined, "Print queue")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/accreditation/scans">
            <div className="text-sm font-medium">{t("console.accreditation.scans", undefined, "Scans")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/accreditation/changes">
            <div className="text-sm font-medium">{t("console.accreditation.changes", undefined, "Changes")}</div>
          </Link>
        </div>
      </div>
    </>
  );
}
