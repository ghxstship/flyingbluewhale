import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="sponsor" title="Brand assets" subtitle="Logos, style guides, approved art">
      <EmptyState title="Upload brand assets" description="Drop logos, brand standards, and approved creative so production can use the right files." />
    </PortalSubpage>
  );
}
