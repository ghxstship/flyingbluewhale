import { TimeOffSurface } from "@/components/workforce/TimeOffSurface";

/** GVTEWAY vendor time off (ADR-0008 Move 3). */
export const dynamic = "force-dynamic";

export default function VendorTimeOffPage() {
  return (
    <TimeOffSurface variant="portal" newRequestHref="/m/time-off/new" eyebrowLabel="Vendor" titleLabel="Time Off" />
  );
}
