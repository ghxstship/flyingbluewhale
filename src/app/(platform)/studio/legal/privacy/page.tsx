import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader title={t("console.legal.privacy.title", undefined, "Privacy")} />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="surface hover-lift p-4" href="/studio/legal/privacy/dsar">
            <div className="text-sm font-medium">{t("console.legal.privacy.dsarLabel", undefined, "DSAR")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/studio/legal/privacy/consent">
            <div className="text-sm font-medium">{t("console.legal.privacy.consentLabel", undefined, "Consent")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/studio/legal/privacy/datamap">
            <div className="text-sm font-medium">{t("console.legal.privacy.dataMap", undefined, "Data map")}</div>
          </Link>
        </div>
      </div>
    </>
  );
}
