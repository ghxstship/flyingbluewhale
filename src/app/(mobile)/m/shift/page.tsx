import { ScheduleSurface } from "@/components/connecteam/ScheduleSurface";

/** COMPVSS shift — thin wrapper over shared <ScheduleSurface>. */
export const dynamic = "force-dynamic";

export default function MobileShiftPage() {
  return <ScheduleSurface variant="mobile" clockInHref="/m/clock" swapHref="/m/shift/swap" />;
}
