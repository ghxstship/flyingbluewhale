import { TimeOffSurface } from "@/components/connecteam/TimeOffSurface";

/**
 * GVTEWAY crew time off — thin wrapper over shared <TimeOffSurface>.
 * New-request CTA cross-shell-deep-links to the mobile request form
 * until portal-side authoring lifts.
 */
export const dynamic = "force-dynamic";

export default function CrewTimeOffPage() {
  return <TimeOffSurface variant="portal" newRequestHref="/m/time-off/new" eyebrowLabel="Crew" titleLabel="Time Off" />;
}
