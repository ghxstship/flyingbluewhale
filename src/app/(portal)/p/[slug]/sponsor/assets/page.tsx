import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="sponsor" title="Assets" subtitle="Brand guidelines, logos, photography">
      <EmptyState
        title="Asset drop"
        description="Brand assets, logos, and approved photography land here after the production team reviews your brand guidelines."
      />
    </PortalSubpage>
  );
}
