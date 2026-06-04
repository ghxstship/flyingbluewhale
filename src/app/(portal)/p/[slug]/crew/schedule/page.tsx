import { ScheduleSurface } from "@/components/connecteam/ScheduleSurface";

/**
 * GVTEWAY crew schedule — thin wrapper over shared <ScheduleSurface>.
 * Clock-in + swap CTAs cross-shell-deep-link to mobile forms until
 * portal-side authoring lifts in a future PR.
 */
export const dynamic = "force-dynamic";

export default function CrewSchedulePage() {
  return (
    <ScheduleSurface
      variant="portal"
      clockInHref="/m/clock"
      swapHref="/m/shift/swap"
      eyebrowLabel="Crew"
      titleLabel="Schedule"
    />
  );
}
