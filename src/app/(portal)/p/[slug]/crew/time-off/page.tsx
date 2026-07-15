import { TimeOffSurface } from "@/components/workforce/TimeOffSurface";

/**
 * GVTEWAY crew time off — thin wrapper over shared <TimeOffSurface>.
 * The new-request form is portal-native as of ADR-0008 Amendment 4.
 */
export const dynamic = "force-dynamic";

export default async function CrewTimeOffPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <TimeOffSurface
      variant="portal"
      newRequestHref={`/p/${slug}/crew/time-off/new`}
      eyebrowLabel="Crew"
      titleLabel="Time Off"
    />
  );
}
