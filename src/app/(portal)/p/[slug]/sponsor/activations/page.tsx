import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  return (
    <PortalSubpage
      slug={slug}
      persona="sponsor"
      title={t("p.sponsor.activations.title", undefined, "Activations")}
      subtitle={t("p.sponsor.activations.subtitle", undefined, "Track deliverables and on-site placements")}
    >
      <EmptyState
        title={t("p.sponsor.activations.empty.title", undefined, "Activation Tracking")}
        description={t(
          "p.sponsor.activations.empty.description",
          undefined,
          "Your activation deliverables post here as the production team scopes each placement. Expect the first batch about 3 weeks before load-in.",
        )}
      />
    </PortalSubpage>
  );
}
