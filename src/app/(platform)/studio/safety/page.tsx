import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader title={t("console.safety.title", undefined, "Safety & Incidents")} />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="surface hover-lift p-4" href="/studio/safety/threats">
            <div className="text-sm font-medium">{t("console.safety.threatsLabel", undefined, "Threats")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/studio/safety/playbooks">
            <div className="text-sm font-medium">{t("console.safety.playbooksLabel", undefined, "Playbooks")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/studio/safety/guard-tours">
            <div className="text-sm font-medium">{t("console.safety.guardToursLabel", undefined, "Guard tours")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/studio/safety/incidents">
            <div className="text-sm font-medium">{t("console.safety.incidentsLabel", undefined, "Incidents")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/studio/safety/major-incident">
            <div className="text-sm font-medium">{t("console.safety.majorIncidentLabel", undefined, "Major incident")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/studio/safety/cyber-ir">
            <div className="text-sm font-medium">{t("console.safety.cyberIrLabel", undefined, "Cyber IR")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/studio/safety/medical/plan">
            <div className="text-sm font-medium">{t("console.safety.medicalPlan", undefined, "Medical plan")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/studio/safety/medical/encounters">
            <div className="text-sm font-medium">
              {t("console.safety.medicalEncounters", undefined, "Medical encounters")}
            </div>
          </Link>
          <Link className="surface hover-lift p-4" href="/studio/safety/environmental">
            <div className="text-sm font-medium">{t("console.safety.environmentalLabel", undefined, "Environmental")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/studio/safety/crisis">
            <div className="text-sm font-medium">{t("console.safety.crisisComms", undefined, "Crisis comms")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/studio/safety/safeguarding">
            <div className="text-sm font-medium">{t("console.safety.safeguardingLabel", undefined, "Safeguarding")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/studio/safety/bcdr">
            <div className="text-sm font-medium">{t("console.safety.bcdrLabel", undefined, "BC/DR")}</div>
          </Link>
        </div>
      </div>
    </>
  );
}
