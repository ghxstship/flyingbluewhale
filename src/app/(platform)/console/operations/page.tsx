import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.operations.eyebrow", undefined, "Operations")}
        title={t("console.operations.title", undefined, "Operations")}
      />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="surface hover-lift p-4" href="/console/operations/dispatch">
            <div className="text-sm font-medium">
              {t("console.operations.dispatch.title", undefined, "Dispatch matrix")}
            </div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              {t("console.operations.dispatch.description", undefined, "Today across crews + venues + vehicles")}
            </div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/operations/maintenance">
            <div className="text-sm font-medium">
              {t("console.operations.maintenance.title", undefined, "Maintenance")}
            </div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              {t("console.operations.maintenance.description", undefined, "PPM + cred-renewal queue")}
            </div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/operations/incidents">
            <div className="text-sm font-medium">{t("console.operations.incidents.title", undefined, "Incidents")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/services/requests">
            <div className="text-sm font-medium">
              {t("console.operations.serviceRequests.title", undefined, "Service requests")}
            </div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              {t("console.operations.serviceRequests.description", undefined, "Triage with SLAs")}
            </div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/ops/toc">
            <div className="text-sm font-medium">{t("console.operations.toc.title", undefined, "TOC (ITIL)")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/safety/incidents">
            <div className="text-sm font-medium">
              {t("console.operations.safetyIncidents.title", undefined, "Safety incidents")}
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
