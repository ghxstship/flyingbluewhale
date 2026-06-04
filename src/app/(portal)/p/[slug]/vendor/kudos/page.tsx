import { KudosSurface } from "@/components/connecteam/KudosSurface";

/** GVTEWAY vendor kudos (ADR-0008 Move 3). */
export const dynamic = "force-dynamic";

export default async function VendorKudosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <KudosSurface
      variant="portal"
      revalidatePath={`/p/${slug}/vendor/kudos`}
      eyebrowLabel="Vendor"
      titleLabel="Kudos"
    />
  );
}
