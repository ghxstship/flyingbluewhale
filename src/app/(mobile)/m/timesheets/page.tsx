import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { canSubmit, formatMinutes, TIMESHEET_STATE_LABEL, type TimesheetState } from "@/lib/db/timesheets";
import { TimesheetsView, type TimesheetRow } from "./TimesheetsView";

/**
 * COMPVSS · My Timesheets — punch → payroll, from the phone.
 *
 * G22: /m/clock wrote `time_entries` and nothing on mobile ever read or wrote
 * `timesheets`, so a worker punched all week and then needed a desktop to turn
 * those punches into something payroll could see.
 */
export const dynamic = "force-dynamic";

export default async function TimesheetsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("m.timesheets.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const fmt = await getRequestFormatters();
  const supabase = await createClient();

  // `timesheets.party_id` → `parties.auth_user_id`. No FK is registered
  // between them, so this is resolved rather than joined. RLS (utt_ts_party)
  // already limits reads to my own party, but the explicit filter means the
  // page doesn't depend on that for correctness.
  const { data: parties } = await supabase
    .from("parties")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("auth_user_id", session.userId)
    // `parties` is soft-deletable: without this, a party archived when someone
    // was offboarded still resolves and their timesheets keep rendering.
    .is("deleted_at", null);

  const partyIds = (parties ?? []).map((p) => (p as { id: string }).id);

  let rows: TimesheetRow[] = [];
  if (partyIds.length) {
    const { data } = await supabase
      .from("timesheets")
      .select("id, period_start, period_end, state, total_minutes, billable_minutes")
      .eq("org_id", session.orgId)
      .in("party_id", partyIds)
      .order("period_start", { ascending: false })
      .limit(50);

    rows = (
      (data ?? []) as {
        id: string;
        period_start: string;
        period_end: string;
        state: TimesheetState;
        total_minutes: number;
        billable_minutes: number;
      }[]
    ).map((r) => ({
      id: r.id,
      period: `${fmt.date(r.period_start)} → ${fmt.date(r.period_end)}`,
      state: r.state,
      stateLabel: TIMESHEET_STATE_LABEL[r.state] ?? r.state,
      total: formatMinutes(r.total_minutes),
      billable: formatMinutes(r.billable_minutes),
      canSubmit: canSubmit(r.state),
    }));
  }

  return (
    <TimesheetsView
      rows={rows}
      // A worker with no party row has no timesheet and never will — say that
      // plainly instead of rendering an empty list that looks like a bug.
      unlinked={partyIds.length === 0}
      eyebrow={t("m.timesheets.eyebrow", undefined, "Time")}
      title={t("m.timesheets.title", undefined, "My Timesheets")}
    />
  );
}
