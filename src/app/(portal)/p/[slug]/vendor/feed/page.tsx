import { FeedSurface } from "@/components/connecteam/FeedSurface";

/** GVTEWAY vendor feed (ADR-0008 Move 3). */
export const dynamic = "force-dynamic";

export default async function VendorFeedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <FeedSurface variant="portal" revalidatePath={`/p/${slug}/vendor/feed`} eyebrowLabel="Vendor" titleLabel="Feed" />
  );
}
