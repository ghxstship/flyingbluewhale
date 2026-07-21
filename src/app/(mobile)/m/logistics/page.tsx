import { requireSession } from "@/lib/auth";
import { listFieldShipments } from "@/lib/mobile/ops-ledgers";
import { LogisticsLedger } from "./LogisticsLedger";

export const dynamic = "force-dynamic";

export default async function LogisticsPage() {
  const session = await requireSession();
  const items = await listFieldShipments(session.orgId);
  return <LogisticsLedger items={items} />;
}
