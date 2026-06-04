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
      persona="guest"
      title={t("p.guest.logistics.title", undefined, "Logistics")}
      subtitle={t("p.guest.logistics.subtitle", undefined, "Parking, gates, ADA, weather")}
    >
      <EmptyState
        title={t("p.guest.logistics.empty.title", undefined, "Logistics Publish Day-Of")}
        description={t(
          "p.guest.logistics.empty.description",
          undefined,
          "Parking gates, ADA access points, and weather notes post here the morning of the show. Your ticket + event guide will still have the entry details.",
        )}
      />
    </PortalSubpage>
  );
}
