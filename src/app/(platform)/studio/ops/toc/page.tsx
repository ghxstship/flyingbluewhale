import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader title={t("console.ops.toc.title", undefined, "TOC")} />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="surface hover-lift p-4" href="/studio/ops/toc/problems">
            <div className="text-sm font-medium">{t("console.ops.toc.problemsLabel", undefined, "Problems")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/studio/ops/toc/changes">
            <div className="text-sm font-medium">{t("console.ops.toc.changesLabel", undefined, "Changes")}</div>
          </Link>
        </div>
      </div>
    </>
  );
}
