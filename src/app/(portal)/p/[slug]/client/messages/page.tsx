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
      persona="client"
      title={t("p.client.messages.title", undefined, "Messages")}
      subtitle={t("p.client.messages.subtitle", undefined, "Production-to-client updates")}
    >
      <EmptyState
        title={t("p.client.messages.empty.title", undefined, "Messages Appear by Email + Here")}
        description={t(
          "p.client.messages.empty.description",
          undefined,
          "Your production desk sends project updates to the email on file; a copy lands here so you can scan the thread without searching your inbox. No inbound from this surface — reach your production lead directly for anything urgent.",
        )}
      />
    </PortalSubpage>
  );
}
