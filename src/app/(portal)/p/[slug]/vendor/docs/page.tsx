import { DocsSurface } from "@/components/workforce/DocsSurface";

/** GVTEWAY vendor docs (ADR-0008 Move 3; portal-native upload per Amendment 4). */
export const dynamic = "force-dynamic";

export default async function VendorDocsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <DocsSurface variant="portal" uploadHref={`/p/${slug}/vendor/docs/new`} eyebrowLabel="Vendor" titleLabel="Docs" />
  );
}
