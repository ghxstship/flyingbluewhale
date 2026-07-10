import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { listOrgScoped } from "@/lib/db/resource";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import type { EventRow } from "@/lib/supabase/types";
import { ScheduleView, type SchedEvent } from "./ScheduleView";

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
  await createClient();
  const fmt = await getRequestFormatters();

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

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">
        {t("m.schedule.eyebrow", { count: events.length }, `Today · ${events.length} Events`)}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.schedule.title", undefined, "Calendar")}
      </h1>
      <ScheduleView events={events} labels={labels} />
    </div>
  );
}
