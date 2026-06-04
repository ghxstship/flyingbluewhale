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
      title={t("p.sponsor.assets.title", undefined, "Assets")}
      subtitle={t("p.sponsor.assets.subtitle", undefined, "Brand guidelines, logos, photography")}
    >
      <EmptyState
        title={t("p.sponsor.assets.empty.title", undefined, "Asset Drop")}
        description={t(
          "p.sponsor.assets.empty.description",
          undefined,
          "Brand assets, logos, and approved photography land here after the production team reviews your brand guidelines.",
        )}
      />
    </PortalSubpage>
  );
}
