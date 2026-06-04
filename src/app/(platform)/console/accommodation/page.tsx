import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader title={t("console.accommodation.title", undefined, "Accommodation")} />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="surface hover-lift p-4" href="/console/accommodation/blocks">
            <div className="text-sm font-medium">
              {t("console.accommodation.groupBlocks", undefined, "Group blocks")}
            </div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/accommodation/village">
            <div className="text-sm font-medium">{t("console.accommodation.village", undefined, "Village")}</div>
          </Link>
        </div>
      </div>
    </>
  );
}
