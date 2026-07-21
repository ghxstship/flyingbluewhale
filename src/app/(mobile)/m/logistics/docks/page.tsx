import { requireSession } from "@/lib/auth";
import { listFieldDockSlots } from "@/lib/mobile/ops-ledgers";
import { DocksLedger } from "./DocksLedger";

export const dynamic = "force-dynamic";

export default async function DocksPage() {
  const session = await requireSession();
  const items = await listFieldDockSlots(session.orgId);
  return <DocksLedger items={items} />;
}
