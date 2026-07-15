import { TimeOffSurface } from "@/components/workforce/TimeOffSurface";

/** GVTEWAY vendor time off (ADR-0008 Move 3; portal-native form per Amendment 4). */
export const dynamic = "force-dynamic";

export default async function VendorTimeOffPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <TimeOffSurface
      variant="portal"
      newRequestHref={`/p/${slug}/vendor/time-off/new`}
      eyebrowLabel="Vendor"
      titleLabel="Time Off"
    />
  );
}
