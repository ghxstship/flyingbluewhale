import { requireSession } from "@/lib/auth";
import { listFieldPermits } from "@/lib/mobile/ops-ledgers";
import { PermitsLedger } from "./PermitsLedger";

export const dynamic = "force-dynamic";

export default async function PermitsPage() {
  const session = await requireSession();
  const items = await listFieldPermits(session.orgId);
  return <PermitsLedger items={items} />;
}
