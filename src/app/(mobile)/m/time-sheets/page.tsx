import { requireSession, isManagerPlus } from "@/lib/auth";
import { TimeSheetsView } from "./TimeSheetsView";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Workforce Time Sheets (kit 34 v3.7 · §5). Manager review of crew
 * punches → approve/flag → Export to Payroll (the handoff boundary). Distinct
 * from the personal My Timesheets (/m/timesheets).
 */
export default async function TimeSheetsPage() {
  const session = await requireSession();
  return <TimeSheetsView canManage={isManagerPlus(session)} />;
}
