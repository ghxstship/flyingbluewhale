import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="artist" title="Catering" subtitle="Meals, dietary preferences, green room">
      <EmptyState
        title="Submit catering as a hospitality rider"
        description="Upload a hospitality rider in advancing — production will confirm substitutions here."
        action={<Button href={`/p/${slug}/artist/advancing`}>Open advancing →</Button>}
      />
    </PortalSubpage>
  );
}
