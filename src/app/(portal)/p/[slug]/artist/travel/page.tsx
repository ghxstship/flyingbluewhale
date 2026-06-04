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
      persona="artist"
      title={t("p.artist.travel.title", undefined, "Travel")}
      subtitle={t("p.artist.travel.subtitle", undefined, "Flights, ground, hotel")}
    >
      <EmptyState
        title={t("p.artist.travel.empty.title", undefined, "Travel Details Arrive Close to Show Day")}
        description={t(
          "p.artist.travel.empty.description",
          undefined,
          "Production desks post the flight, ground, and hotel handoff here about a week before you travel. You'll also get a confirmation email.",
        )}
      />
    </PortalSubpage>
  );
}
