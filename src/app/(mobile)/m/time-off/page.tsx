import { TimeOffSurface } from "@/components/connecteam/TimeOffSurface";

/** COMPVSS time off — thin wrapper over shared <TimeOffSurface>. */
export const dynamic = "force-dynamic";

export default function MobileTimeOffPage() {
  return <TimeOffSurface variant="mobile" newRequestHref="/m/time-off/new" />;
}
