import { requireSession } from "@/lib/auth";
import { listFieldDeliveries } from "@/lib/mobile/ops-ledgers";
import { DeliveryLedger } from "./DeliveryLedger";

export const dynamic = "force-dynamic";

export default async function DeliveryPage() {
  const session = await requireSession();
  const items = await listFieldDeliveries(session.orgId);
  return <DeliveryLedger items={items} />;
}
