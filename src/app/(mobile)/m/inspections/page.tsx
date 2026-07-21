import { requireSession } from "@/lib/auth";
import { listFieldInspections } from "@/lib/mobile/ops-ledgers";
import { InspectionsLedger } from "./InspectionsLedger";

export const dynamic = "force-dynamic";

export default async function InspectionsPage() {
  const session = await requireSession();
  const items = await listFieldInspections(session.orgId);
  return <InspectionsLedger items={items} />;
}
