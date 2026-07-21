import { requireSession } from "@/lib/auth";
import { listFieldGateQueue } from "@/lib/mobile/ops-ledgers";
import { GateLedger } from "./GateLedger";

export const dynamic = "force-dynamic";

export default async function GatePage() {
  const session = await requireSession();
  const items = await listFieldGateQueue(session.orgId);
  return <GateLedger items={items} />;
}
