import { ScheduleSurface } from "@/components/connecteam/ScheduleSurface";

/**
 * GVTEWAY vendor schedule (ADR-0008 Move 3) — thin wrapper over the
 * shared <ScheduleSurface>. Same data + render as the crew variant;
 * only the eyebrow + cross-shell CTAs differ.
 */
export const dynamic = "force-dynamic";

export default function VendorSchedulePage() {
  return (
    <ScheduleSurface
      variant="portal"
      clockInHref="/m/clock"
      swapHref="/m/requests"
      eyebrowLabel="Vendor"
      titleLabel="Schedule"
    />
  );
}
