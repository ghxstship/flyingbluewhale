import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { listOrgScoped } from "@/lib/db/resource";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import type { EventRow } from "@/lib/supabase/types";
import { ScheduleView, type SchedEvent } from "./ScheduleView";
import { MyShifts, type MyShift } from "./MyShifts";
import { ShiftReminderScheduler } from "@/components/mobile/ShiftReminderScheduler";
import type { ShiftReminder } from "@/lib/native/shift-reminders";

export const dynamic = "force-dynamic";

/**
 * COMPVSS `/m/schedule` — the field calendar. Server component: fetches the
 * org-scoped `events` (RLS-gated to the viewer's membership), maps them to the
 * plain `SchedEvent` shape, and hands them — with translated labels — to the
 * `<ScheduleView>` kit client (list / calendar / table). Ref app.jsx 1743-1823.
 */

function toneFor(state: string): SchedEvent["tone"] {
  switch (state) {
    case "live":
      return "ok";
    case "scheduled":
      return "info";
    case "cancelled":
      return "danger";
    case "draft":
      return "warn";
    default:
      return "neutral";
  }
}

export default async function MobileSchedulePage() {
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

  // The viewer's OWN shifts, resolved through `crew_members` — the person SSOT.
  //
  // This used to resolve through `workforce_members`, which is why the surface
  // was empty for EVERY user: nothing ever set `workforce_members.user_id`
  // (0 of 105 rows). `crew_members.user_id` is populated by /me/crew and, since
  // ADR-0015, by the invite-accept claim — so this lookup can actually succeed.
  const { data: crew } = await supabase
    .from("crew_members")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .maybeSingle();

  let myShifts: MyShift[] = [];
  let reminders: ShiftReminder[] = [];
  if (crew?.id) {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString();
    const { data: shiftRows } = await supabase
      .from("shifts")
      .select("id, starts_at, ends_at, attendance, role, venue:venue_id(name)")
      .eq("org_id", session.orgId)
      .eq("crew_member_id", crew.id)
      .gte("starts_at", from)
      .lt("starts_at", to)
      .order("starts_at", { ascending: true });

    const todayKey = now.toDateString();
    const tomorrowKey = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toDateString();
    // The OS fires local notifications with the app closed, so opening the
    // schedule is the moment to hand it the list. Time-based reminders, not
    // arrival detection — see src/lib/native/shift-reminders.ts.
    reminders = (shiftRows ?? []).map((s) => ({
      shiftId: s.id as string,
      startsAt: s.starts_at as string,
      endsAt: (s.ends_at as string | null) ?? null,
      venueName: (s.venue as { name: string | null } | null)?.name ?? null,
    }));
    myShifts = (shiftRows ?? []).map((s) => {
      const start = new Date(s.starts_at as string);
      const key = start.toDateString();
      const venueName = (s.venue as { name: string | null } | null)?.name ?? null;
      return {
        id: s.id as string,
        isToday: key === todayKey,
        dayLabel:
          key === todayKey
            ? t("m.schedule.today", undefined, "Today")
            : key === tomorrowKey
              ? t("m.schedule.tomorrow", undefined, "Tomorrow")
              : fmt.dateParts(start, { weekday: "short", month: "short", day: "numeric" }),
        time: `${fmt.dateParts(start, { hour: "2-digit", minute: "2-digit", hour12: false })}–${fmt.dateParts(
          new Date(s.ends_at as string),
          { hour: "2-digit", minute: "2-digit", hour12: false },
        )}`,
        role: (s.role as string | null) ?? null,
        venue: venueName,
        attendance: (s.attendance as string) ?? "scheduled",
      };
    });
  }

  const rows = (await listOrgScoped("events", session.orgId, {
    orderBy: "starts_at",
    ascending: true,
  })) as EventRow[];

  // `events` carries no typed `kind` column — every row is treated as a shift
  // for type-faceting (per the table map). Time/day are derived for display.
  const events: SchedEvent[] = rows.map((e) => {
    const start = new Date(e.starts_at);
    return {
      id: e.id,
      name: e.name,
      type: "shift",
      time: fmt.dateParts(start, { hour: "2-digit", minute: "2-digit", hour12: false }),
      dateKey: e.starts_at.slice(0, 10),
      sub: e.description ?? fmt.date(e.starts_at),
      state: toTitle(e.event_state),
      tone: toneFor(e.event_state),
    };
  });

  const labels = {
    search: t("m.schedule.search", undefined, "Search Schedule…"),
    empty: t("m.schedule.empty", undefined, "Nothing Here"),
    emptyBody: t("m.schedule.emptyBody", undefined, "No items match these filters."),
    emptyDay: t("m.schedule.emptyDay", undefined, "Nothing Scheduled"),
    emptyDayBody: t("m.schedule.emptyDayBody", undefined, "No items on this day."),
    typeShift: t("m.schedule.type.shift", undefined, "Shift"),
    typeMeeting: t("m.schedule.type.meeting", undefined, "Meeting"),
    typeTraining: t("m.schedule.type.training", undefined, "Training"),
    typeRos: t("m.schedule.type.ros", undefined, "Run of Show"),
    groupNone: t("m.schedule.group.none", undefined, "None"),
    groupType: t("m.schedule.group.type", undefined, "Type"),
    sortTime: t("m.schedule.sort.time", undefined, "Time"),
    sortName: t("m.schedule.sort.name", undefined, "Name"),
    filterType: t("m.schedule.filter.type", undefined, "Type"),
    reset: t("m.schedule.reset", undefined, "Reset Filters"),
    colEvent: t("m.schedule.col.event", undefined, "Event"),
    colType: t("m.schedule.col.type", undefined, "Type"),
    colTime: t("m.schedule.col.time", undefined, "Time"),
    colDetail: t("m.schedule.col.detail", undefined, "Detail"),
    colStatus: t("m.schedule.col.status", undefined, "Status"),
  };

  // This shell has no ICU plural support (src/lib/i18n/t.ts), so the
  // singular gets its own key rather than a fabricated "1 Shifts".
  const todayCount = myShifts.filter((s) => s.isToday).length;

  return (
    <div className="screen screen-anim">
      {/* Renders nothing — hands the OS the reminder schedule so it can fire
          with the app closed. */}
      <ShiftReminderScheduler shifts={reminders} />
      <div className="scr-eye">
        {todayCount === 1
          ? t("m.schedule.eyebrowOne", undefined, "Today · 1 Shift")
          : t("m.schedule.eyebrow", { count: todayCount }, `Today · ${todayCount} Shifts`)}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.schedule.title", undefined, "Calendar")}
      </h1>

      {/* Your own shifts first. The org calendar below is context; this is
          the part that tells you whether to get in the van. */}
      <MyShifts
        shifts={myShifts}
        labels={{
          heading: t("m.schedule.myShift", undefined, "Your Shift Today"),
          none: t("m.schedule.noShift", undefined, "No Shift Today"),
          noneBody: t("m.schedule.noShiftBody", undefined, "Nothing rostered for you today. Check upcoming below."),
          clockIn: t("m.schedule.clockIn", undefined, "Clock In"),
          upcoming: t("m.schedule.upcomingShifts", undefined, "Your Next 7 Days"),
          swap: {
            cta: t("m.schedule.swap.cta", undefined, "Can't Make It"),
            reason: t("m.schedule.swap.reason", undefined, "Why?"),
            placeholder: t("m.schedule.swap.placeholder", undefined, "Your manager will see this."),
            send: t("m.schedule.swap.send", undefined, "Send"),
            cancel: t("m.schedule.swap.cancel", undefined, "Cancel"),
            sent: t("m.schedule.swap.sent", undefined, "Swap requested. Your manager has been notified."),
          },
        }}
      />

      <div className="sech">
        <h2>{t("m.schedule.orgCalendar", undefined, "Production Calendar")}</h2>
      </div>
      <ScheduleView events={events} labels={labels} />
    </div>
  );
}
