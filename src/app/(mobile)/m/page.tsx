import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { HomeShell, type HomeData, type HomeLabels } from "./HomeShell";

export const dynamic = "force-dynamic";

/**
 * COMPVSS `/m` home — the field dashboard. Server component: fetches the real
 * counts (open tasks assigned to me, my assignments, recent chat messages) and
 * the next upcoming event, then hands plain data + translated labels to the
 * `<HomeShell>` client island. Design ref: app.jsx 1663-1711.
 */
export default async function MobileHome() {
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const nowIso = new Date().toISOString();

  // The four dashboard reads are independent of each other — run them in
  // one parallel round (HP-12); this is the field PWA home, often on a bad
  // network, so serial waterfalls hurt the most here.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const today = nowIso.slice(0, 10);
  const [{ count: openTasks }, { count: myAdvances }, { count: unread }, { data: ev }, { data: sheetRows }] =
    await Promise.all([
    // Open tasks assigned to me (anything not yet done).
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("assigned_to", session.userId)
      .neq("task_state", "done"),
    // My assignments (advancing — tickets/credentials/etc.).
    supabase
      .from("assignments")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("party_user_id", session.userId)
      .is("deleted_at", null),
    // Recent chat messages (last 7 days) as the "unread" proxy — no per-user
    // read cursor join here; the inbox surface owns precise unread accounting.
    supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .gte("created_at", sevenDaysAgo),
    // Next upcoming event.
    supabase
      .from("events")
      .select("id, name, starts_at, event_state")
      .eq("org_id", session.orgId)
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    // Today's (or the next) PUBLISHED day sheet — the kit 26 push-to-field
    // artifact. Published/updated only: drafts never reach the crew.
    supabase
      .from("day_sheets")
      .select("id, city, venue, sheet_date, crew_call, doors, headline_set, curfew, sheet_state")
      .eq("org_id", session.orgId)
      .in("sheet_state", ["published", "updated"])
      .gte("sheet_date", today)
      .is("deleted_at", null)
      .order("sheet_date", { ascending: true })
      .limit(1),
  ]);

  const nextShift: HomeData["nextShift"] = ev
    ? {
        id: ev.id,
        name: ev.name,
        time: fmt.dateParts(new Date(ev.starts_at), {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        day: fmt.date(ev.starts_at),
        sub: t("m.home.upcoming.sub", undefined, "Upcoming Event"),
      }
    : null;

  const sheet = ((sheetRows ?? []) as Array<{
    id: string;
    city: string | null;
    venue: string | null;
    sheet_date: string | null;
    crew_call: string | null;
    doors: string | null;
    headline_set: string | null;
    curfew: string | null;
    sheet_state: string;
  }>)[0];
  const trim = (v: string | null) => (v ? v.slice(0, 5) : null); // HH:MM from HH:MM:SS time columns
  const daySheet: HomeData["daySheet"] = sheet
    ? {
        where: [sheet.city, sheet.venue].filter(Boolean).join(" · ") || t("m.home.daySheet.fallbackWhere", undefined, "Show Day"),
        date: sheet.sheet_date ? fmt.date(sheet.sheet_date) : "",
        call: trim(sheet.crew_call),
        doors: trim(sheet.doors),
        set: sheet.headline_set,
        curfew: trim(sheet.curfew),
        updated: sheet.sheet_state === "updated",
      }
    : null;

  const data: HomeData = {
    openTasks: openTasks ?? 0,
    myAdvances: myAdvances ?? 0,
    unread: unread ?? 0,
    nextShift,
    daySheet,
  };

  const greeting = fmt.dateParts(new Date(), {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const labels: HomeLabels = {
    title: t("m.home.title", undefined, "Dashboard"),
    clockTitle: t("m.home.clock.title", undefined, "Local Time"),
    clockSub: t("m.home.clock.sub", undefined, "Clock In"),
    copilotTitle: t("m.home.copilot.title", undefined, "Field Copilot"),
    copilotSub: t("m.home.copilot.sub", undefined, "Ask · Report · Get Unstuck"),
    widgets: t("m.home.widgets", undefined, "Today"),
    wTasks: t("m.home.w.tasks", undefined, "Open Tasks"),
    wTasksSub: t("m.home.w.tasksSub", undefined, "Assigned To You"),
    wAdvances: t("m.home.w.advances", undefined, "Assignments"),
    wAdvancesSub: t("m.home.w.advancesSub", undefined, "Across Every Show"),
    wUnread: t("m.home.w.unread", undefined, "Messages"),
    wUnreadSub: t("m.home.w.unreadSub", undefined, "Recent Activity"),
    quickActions: t("m.home.quickActions", undefined, "Quick Actions"),
    upcoming: t("m.home.upcomingLabel", undefined, "Upcoming"),
    viewAll: t("m.home.viewAll", undefined, "View All Upcoming Events"),
    noShift: t("m.home.noShift", undefined, "Nothing Scheduled"),
    noShiftBody: t("m.home.noShiftBody", undefined, "Your next call lands here."),
    daySheet: t("m.home.daySheet", undefined, "Day Sheet"),
    dsUpdated: t("m.home.daySheet.updated", undefined, "Updated"),
    dsCall: t("m.home.daySheet.call", undefined, "Crew Call"),
    dsDoors: t("m.home.daySheet.doors", undefined, "Doors"),
    dsSet: t("m.home.daySheet.set", undefined, "Set"),
    dsCurfew: t("m.home.daySheet.curfew", undefined, "Curfew"),
    newSheet: t("m.home.newSheet", undefined, "Create"),
    newSheetBody: t("m.home.newSheetBody", undefined, "What Do You Need?"),
    qaReport: t("m.home.qa.report", undefined, "Report"),
    qaScan: t("m.home.qa.scan", undefined, "Scan"),
    qaClock: t("m.home.qa.clock", undefined, "Clock"),
    qaAdvance: t("m.home.qa.advance", undefined, "Advances"),
    qaApprove: t("m.home.qa.approve", undefined, "Approve"),
    qaExpense: t("m.home.qa.expense", undefined, "Expense"),
    qaSwap: t("m.home.qa.swap", undefined, "Swap"),
    qaInvite: t("m.home.qa.invite", undefined, "Invite"),
  };

  return <HomeShell data={data} greeting={greeting} labels={labels} />;
}
