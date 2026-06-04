import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader title={t("console.programs.title", undefined, "Programs")} />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="surface hover-lift p-4" href="/console/programs/schedule">
            <div className="text-sm font-medium">{t("console.programs.schedule", undefined, "Master schedule")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/programs/risk">
            <div className="text-sm font-medium">{t("console.programs.risk", undefined, "Risk register")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/programs/reviews">
            <div className="text-sm font-medium">{t("console.programs.reviews", undefined, "Reviews")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/programs/readiness">
            <div className="text-sm font-medium">{t("console.programs.readiness", undefined, "Readiness")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/programs/scope">
            <div className="text-sm font-medium">{t("console.programs.scope", undefined, "Scope")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/programs/sessions">
            <div className="text-sm font-medium">{t("console.programs.sessions", undefined, "Sessions")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/programs/ceremonies">
            <div className="text-sm font-medium">{t("console.programs.ceremonies", undefined, "Ceremonies")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/programs/protocol">
            <div className="text-sm font-medium">{t("console.programs.protocol", undefined, "Protocol")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/programs/pressconf">
            <div className="text-sm font-medium">{t("console.programs.pressconf", undefined, "Press conferences")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/programs/cases">
            <div className="text-sm font-medium">{t("console.programs.cases", undefined, "Cases")}</div>
          </Link>
        </div>
      </div>
    </>
  );
}
