import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="sponsor" title="Activations" subtitle="Track deliverables and on-site placements">
      <EmptyState title="Activation tracking" description="Your activation deliverables post here as the production team scopes each placement." />
    </PortalSubpage>
  );
}
