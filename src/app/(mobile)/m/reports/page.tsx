import { requireSession } from "@/lib/auth";
import { listFieldReports } from "@/lib/mobile/ops-ledgers";
import { ReportsLedger } from "./ReportsLedger";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await requireSession();
  const items = await listFieldReports(session.orgId);
  return <ReportsLedger items={items} />;
}
