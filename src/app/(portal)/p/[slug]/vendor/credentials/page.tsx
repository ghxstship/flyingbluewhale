import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="vendor" title="Credentials" subtitle="COI, W-9, business licenses">
      <EmptyState title="Upload credentials" description="Keep compliance docs current — expiring COIs auto-flag your account." />
    </PortalSubpage>
  );
}
