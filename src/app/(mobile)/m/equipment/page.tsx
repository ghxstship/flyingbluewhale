import { requireSession, isManagerPlus } from "@/lib/auth";
import { HubChrome } from "@/components/mobile/HubChrome";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Assets & Equipment hub — kit 34 v3.1/v3.2. Members: Inventory ·
 * Catalog · Requests. SSOT: `mobileHubs` in nav.ts.
 */
export default async function EquipmentHubPage() {
  const session = await requireSession();
  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="equipment" canManage={isManagerPlus(session)} />
    </div>
  );
}
