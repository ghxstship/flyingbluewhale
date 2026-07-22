import { EmptyState } from "@/components/ui/EmptyState";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Stakeholder sustainability — ESG posture (carbon + community impact) for the
 * board observer. The ESG data model is not yet populated; the surface renders
 * its intent so the persona's IA is complete.
 */
export default async function StakeholderSustainability({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getRequestT();
  const { slug } = await params;
  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "stakeholder")} />
      <div className="flex-1 p-6">
        <h1>{t("p.stakeholder.sustainability.title", undefined, "Sustainability")}</h1>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t("p.stakeholder.sustainability.subtitle", undefined, "ESG reporting + sustainability posture.")}
        </p>
        <div className="mt-5">
          <EmptyState
            title={t("p.stakeholder.sustainability.empty.title", undefined, "No ESG Reporting Yet")}
            description={t(
              "p.stakeholder.sustainability.empty.description",
              undefined,
              "Carbon footprint and community-impact reporting will appear here once sustainability tracking is enabled for this organization.",
            )}
          />
        </div>
      </div>
    </div>
  );
}
