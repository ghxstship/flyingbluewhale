import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="vendor" title="Submissions" subtitle="Quotes and vendor packages">
      <EmptyState title="No open RFQs" description="When production issues an RFQ, it'll appear here for submission." />
    </PortalSubpage>
  );
}
