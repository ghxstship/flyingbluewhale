import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="crew" title="Advances" subtitle="Request per-diem or cash advances">
      <EmptyState
        title="Request an advance"
        description="Submit a per-diem or emergency cash request. Approvers are notified in Slack and email."
        action={<Button href="/console/finance/advances/new">Request advance →</Button>}
      />
    </PortalSubpage>
  );
}
