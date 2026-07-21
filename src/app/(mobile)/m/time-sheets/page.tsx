import { requireSession, isManagerPlus } from "@/lib/auth";
import { getRequestT, getRequestFormatters } from "@/lib/i18n/request";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { TimeSheetsView, type TimesheetRow } from "./TimeSheetsView";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Workforce Time Sheets (kit 34 v3.7 · §5). Manager review of REAL
 * submitted `timesheets` → approve/flag (the shared decideTimesheet FSM) →
 * Export approved hours to payroll (CSV). Distinct from the personal My
 * Timesheets (/m/timesheets).
 *
 * This is a `managerOnly` Workforce-hub member: it self-hides from the crew
 * launcher, and — mirroring the Finance gate — a crew member who deep-links
 * here gets the read-blocked "Manager Access Only" state. Capability is not
 * authorization.
 */
export default async function TimeSheetsPage() {
  const session = await requireSession();
  const canManage = isManagerPlus(session);
  const { t } = await getRequestT();

  if (!canManage) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.timeSheets.eyebrow", undefined, "Workforce")}</div>
        <h1 className="scr-h" style={{ marginBottom: 12 }}>
          {t("m.timeSheets.title", undefined, "Time Sheets")}
        </h1>
        <EmptyState
          size="compact"
          title={t("m.timeSheets.gated.title", undefined, "Manager Access Only")}
          description={t(
            "m.timeSheets.gated.body",
            undefined,
            "Approving crew hours and exporting to payroll is an approvals surface. Ask a manager if you need these.",
          )}
        />
      </div>
    );
  }

  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  // Real org timesheets in reviewable states. `timesheets.party_id` → `parties`
  // (no FK registered), so worker names hydrate with a second query.
  const { data } = await supabase
    .from("timesheets")
    .select("id, party_id, period_start, period_end, state, total_minutes, billable_minutes")
    .eq("org_id", session.orgId)
    .in("state", ["submitted", "approved", "rejected"])
    .order("period_start", { ascending: false })
    .limit(200);
  const sheets = (data ?? []) as Array<{
    id: string;
    party_id: string;
    period_start: string;
    period_end: string;
    state: string;
    total_minutes: number | null;
    billable_minutes: number | null;
  }>;

  const partyIds = [...new Set(sheets.map((s) => s.party_id))];
  const nameById = new Map<string, string>();
  if (partyIds.length) {
    const { data: parties } = await supabase
      .from("parties")
      .select("id, display_name")
      .eq("org_id", session.orgId)
      .in("id", partyIds);
    for (const p of (parties ?? []) as Array<{ id: string; display_name: string }>) {
      nameById.set(p.id, p.display_name);
    }
  }

  const rows: TimesheetRow[] = sheets.map((s) => ({
    id: s.id,
    worker: nameById.get(s.party_id) ?? t("m.timeSheets.unknownWorker", undefined, "Worker"),
    period: `${fmt.date(s.period_start)} – ${fmt.date(s.period_end)}`,
    minutes: s.total_minutes ?? 0,
    billableMinutes: s.billable_minutes ?? 0,
    state: s.state,
  }));

  return <TimeSheetsView rows={rows} />;
}
