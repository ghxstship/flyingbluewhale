import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader title={t("console.ops.title", undefined, "Operations")} />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="surface hover-lift p-4" href="/console/ops/toc">
            <div className="text-sm font-medium">{t("console.ops.tocLabel", undefined, "TOC")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/ops/toc/problems">
            <div className="text-sm font-medium">{t("console.ops.problems", undefined, "Problems")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/ops/toc/changes">
            <div className="text-sm font-medium">{t("console.ops.changes", undefined, "Changes")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/settings/integrations">
            <div className="text-sm font-medium">{t("console.ops.integrations", undefined, "Integrations")}</div>
          </Link>
        </div>
      </div>
    </>
  );
}
