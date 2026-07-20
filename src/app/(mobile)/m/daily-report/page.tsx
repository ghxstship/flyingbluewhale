import { requireSession, isManagerPlus } from "@/lib/auth";
import { DailyReportView } from "./DailyReportView";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Daily Report (kit 34 v3.7) — the Operations hub's end-of-day
 * rollup. Aggregates shift notes + ops-ledger signals into one
 * filable/exportable record. Distinct from `/m/daily-log` (the weather+notes
 * site log this report files into).
 */
export default async function DailyReportPage() {
  const session = await requireSession();
  return <DailyReportView canManage={isManagerPlus(session)} />;
}
