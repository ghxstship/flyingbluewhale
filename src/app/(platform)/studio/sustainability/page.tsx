import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader title={t("console.sustainability.title", undefined, "Sustainability")} />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="surface hover-lift p-4" href="/studio/sustainability/carbon">
            <div className="text-sm font-medium">{t("console.sustainability.carbonLabel", undefined, "Carbon")}</div>
          </Link>
        </div>
      </div>
    </>
  );
}
