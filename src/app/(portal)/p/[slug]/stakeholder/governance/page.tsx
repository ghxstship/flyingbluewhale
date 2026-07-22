import { EmptyState } from "@/components/ui/EmptyState";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Stakeholder governance — committees, charters, and approval-gate cadence for
 * the board/principal observer. The structured governance model is not yet
 * populated; the surface renders its intent so the persona's IA is complete.
 */
export default async function StakeholderGovernance({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getRequestT();
  const { slug } = await params;
  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "stakeholder")} />
      <div className="flex-1 p-6">
        <h1>{t("p.stakeholder.governance.title", undefined, "Governance")}</h1>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t("p.stakeholder.governance.subtitle", undefined, "Committees, policies, and approval gates.")}
        </p>
        <div className="mt-5">
          <EmptyState
            title={t("p.stakeholder.governance.empty.title", undefined, "No Committees Yet")}
            description={t(
              "p.stakeholder.governance.empty.description",
              undefined,
              "Committee charters, meeting cadence, and approval gates will appear here once governance is configured for this organization.",
            )}
          />
        </div>
      </div>
    </div>
  );
}
