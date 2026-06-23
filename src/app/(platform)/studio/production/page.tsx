import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Production hub (ADR-0006). The flagship capability — audio, lighting,
 * video, staging, rigging, power, fabrication — gets its own front
 * door, surfacing the three sub-domains as card-grid sections:
 * Inventory · Build · Show. Mirrors the sidebar shape so deep-linking
 * to /studio/production lands operators on the same mental model
 * they'll see in the rail.
 */
export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.hub.eyebrow", undefined, "Production")}
        title={t("console.production.hub.title", undefined, "Production")}
        subtitle={t("console.production.hub.subtitle", undefined, "Inventory, build, show systems.")}
      />
      <div className="page-content space-y-6">
        <section>
          <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {t("console.production.hub.sections.inventory", undefined, "Inventory")}
          </h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link className="surface hover-lift p-4" href="/studio/production/equipment">
              <div className="text-sm font-medium">
                {t("console.production.hub.cards.equipment", undefined, "Equipment")}
              </div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">
                {t("console.production.hub.cards.equipmentDesc", undefined, "Owned assets + maintenance")}
              </div>
            </Link>
            <Link className="surface hover-lift p-4" href="/studio/production/equipment/utilization">
              <div className="text-sm font-medium">
                {t("console.production.hub.cards.equipmentUtil", undefined, "Equipment Utilization")}
              </div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">
                {t("console.production.hub.cards.equipmentUtilDesc", undefined, "30/90-day rollup + idle revenue")}
              </div>
            </Link>
            <Link className="surface hover-lift p-4" href="/studio/production/av">
              <div className="text-sm font-medium">
                {t("console.production.hub.cards.avInventory", undefined, "AV Inventory")}
              </div>
            </Link>
            <Link className="surface hover-lift p-4" href="/studio/production/rentals">
              <div className="text-sm font-medium">
                {t("console.production.hub.cards.rentals", undefined, "Rentals")}
              </div>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {t("console.production.hub.sections.build", undefined, "Build")}
          </h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link className="surface hover-lift p-4" href="/studio/production/fabrication">
              <div className="text-sm font-medium">
                {t("console.production.hub.cards.fabrication", undefined, "Fabrication")}
              </div>
            </Link>
            <Link className="surface hover-lift p-4" href="/studio/production/compounds">
              <div className="text-sm font-medium">
                {t("console.production.hub.cards.compounds", undefined, "Compounds")}
              </div>
            </Link>
            <Link className="surface hover-lift p-4" href="/studio/production/warehouse">
              <div className="text-sm font-medium">{t("console.production.hub.cards.yard", undefined, "Yard")}</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/studio/punch">
              <div className="text-sm font-medium">
                {t("console.production.hub.cards.punchList", undefined, "Punch List")}
              </div>
            </Link>
            <Link className="surface hover-lift p-4" href="/studio/captures">
              <div className="text-sm font-medium">
                {t("console.production.hub.cards.realityCaptures", undefined, "Reality Captures")}
              </div>
            </Link>
            <Link className="surface hover-lift p-4" href="/studio/photos">
              <div className="text-sm font-medium">
                {t("console.production.hub.cards.photoLog", undefined, "Photo Log")}
              </div>
            </Link>
            <Link className="surface hover-lift p-4" href="/studio/warranties">
              <div className="text-sm font-medium">
                {t("console.production.hub.cards.warranties", undefined, "Warranties")}
              </div>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {t("console.production.hub.sections.show", undefined, "Show")}
          </h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link className="surface hover-lift p-4" href="/studio/production/ros">
              <div className="text-sm font-medium">
                {t("console.production.hub.cards.runOfShow", undefined, "Run of Show")}
              </div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">
                {t("console.production.hub.cards.runOfShowDesc", undefined, "Cue-by-cue timeline")}
              </div>
            </Link>
            <Link className="surface hover-lift p-4" href="/studio/production/dispatch/live">
              <div className="text-sm font-medium">
                {t("console.production.hub.cards.liveDispatch", undefined, "Live Dispatch")}
              </div>
            </Link>
            <Link className="surface hover-lift p-4" href="/studio/production/logistics">
              <div className="text-sm font-medium">
                {t("console.production.hub.cards.productionLogistics", undefined, "Production Logistics")}
              </div>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
