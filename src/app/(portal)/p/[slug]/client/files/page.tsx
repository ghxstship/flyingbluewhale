import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="client" title="Files" subtitle="Shared documents and assets">
      <EmptyState title="No shared files yet" description="Production drops concept docs, run-of-show, and proof files here." />
    </PortalSubpage>
  );
}
