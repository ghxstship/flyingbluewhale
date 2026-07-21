import { requireSession } from "@/lib/auth";
import { listFieldTravel } from "@/lib/mobile/ops-ledgers";
import { TravelLedger } from "./TravelLedger";

export const dynamic = "force-dynamic";

export default async function TravelPage() {
  const session = await requireSession();
  const items = await listFieldTravel(session.orgId);
  return <TravelLedger items={items} />;
}
