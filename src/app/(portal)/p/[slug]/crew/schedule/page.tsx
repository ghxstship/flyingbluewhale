import { ScheduleSurface } from "@/components/workforce/ScheduleSurface";

/**
 * GVTEWAY crew schedule — thin wrapper over shared <ScheduleSurface>.
 *
 * Swap requests file inline on the shift card (ADR-0008 Amendment 4). The
 * old "Swap shift" CTA pointed at `/m/requests`, which is the manager
 * approvals queue — an empty read-only list for the crew member clicking it.
 *
 * `clockIn: "compvss"` — crew hold `{compvss: full}` reach, so signposting
 * the punch is honest for this audience. The punch itself stays in COMPVSS
 * because it needs a geofence fix and the offline outbox; a desktop punch
 * would have neither.
 */
export const dynamic = "force-dynamic";

export default async function CrewSchedulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <ScheduleSurface
      variant="portal"
      clockIn="compvss"
      revalidate={`/p/${slug}/crew/schedule`}
      eyebrowLabel="Crew"
      titleLabel="Schedule"
    />
  );
}
