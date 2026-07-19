import { requireSession, isManagerPlus } from "@/lib/auth";
import { HubChrome } from "@/components/mobile/HubChrome";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Workforce hub — kit 34 v3.1/v3.2. Members: Schedule · Time Sheets ·
 * Roster · Time Off (Schedule + Time Sheets are `approve`/`assign`-gated and
 * self-hide for crew). SSOT: `mobileHubs` in nav.ts.
 */
export default async function WorkforceHubPage() {
  const session = await requireSession();
  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="workforce" canManage={isManagerPlus(session)} />
    </div>
  );
}
