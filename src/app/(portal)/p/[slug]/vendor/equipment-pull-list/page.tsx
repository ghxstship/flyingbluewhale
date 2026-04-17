import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="vendor" title="Equipment pull list" subtitle="Gear assigned to your account for this show">
      <EmptyState title="No equipment assigned" description="Pull list is generated from the master schedule; re-check after advancing approval." />
    </PortalSubpage>
  );
}
