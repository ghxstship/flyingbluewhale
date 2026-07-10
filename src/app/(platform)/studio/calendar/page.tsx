import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { CalendarView, type CalendarEvent } from "@/components/views/CalendarView";
import type { EventRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

/**
 * /studio/calendar — the kit v7 <CalendarView> workspace. A full-bleed
 * month/week/day/agenda calendar over the org's events (distinct from
 * /studio/schedule, which pairs a calendar with a tabular event list). Mounted
 * read-only here: drag-to-reschedule lives on the Schedule surface.
 */
export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Operations" title={t("console.calendar.title", undefined, "Calendar")} />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const sp = await searchParams;

  // Query a date window around the visible month instead of the whole table.
  // <CalendarView> syncs its cursor to `?date=YYYY-MM-DD` (router.replace →
  // RSC re-render), so navigating months re-runs this query for the new
  // window. Window = the cursor's month padded by one month either side
  // (covers the month grid's leading/trailing weeks and adjacent-week/day
  // views). No row cap: the window bounds the result set instead — the old
  // default limit of 100 silently pinned the calendar to the org's 100
  // oldest events.
  const cursor = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? new Date(`${sp.date}T00:00:00Z`) : new Date();
  const windowStart = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - 1, 1));
  const windowEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 2, 1));
  const rows = (await listOrgScoped("events", session.orgId, {
    orderBy: "starts_at",
    ascending: true,
    limit: 0,
    filters: [
      { column: "starts_at", op: "gte", value: windowStart.toISOString() },
      { column: "starts_at", op: "lte", value: windowEnd.toISOString() },
    ],
  })) as EventRow[];

  const events: CalendarEvent[] = rows.map((e) => ({
    id: e.id,
    title: e.name,
    start: e.starts_at,
    end: e.ends_at,
    tone: toneForStatus(e.event_state),
    href: e.event_kind === "meeting" ? `/studio/meetings/${e.id}` : `/studio/events/${e.id}`,
  }));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.calendar.eyebrow", undefined, "Operations")}
        title={t("console.calendar.title", undefined, "Calendar")}
        subtitle={
          rows.length === 1
            ? t("console.calendar.subtitleOne", { count: rows.length }, "{count} event")
            : t("console.calendar.subtitleOther", { count: rows.length }, "{count} events")
        }
        breadcrumbs={[{ label: "Operations" }, { label: "Calendar" }]}
        action={<Button href="/studio/events/new">{t("console.calendar.newEvent", undefined, "+ New Event")}</Button>}
      />
      <div className="page-content">
        {events.length === 0 ? (
          <EmptyState
            title={t("console.calendar.emptyTitle", undefined, "Nothing on the calendar")}
            description={t(
              "console.calendar.emptyDescription",
              undefined,
              "Events scheduled across your org appear here. Create an event to populate the calendar.",
            )}
            action={
              <Button href="/studio/events/new">{t("console.calendar.newEvent", undefined, "+ New Event")}</Button>
            }
          />
        ) : (
          <CalendarView events={events} initialMode="month" />
        )}
      </div>
    </>
  );
}

/** Map domain event status -> abstract calendar tone. */
function toneForStatus(status: string): CalendarEvent["tone"] {
  switch (status) {
    case "confirmed":
    case "complete":
      return "success";
    case "live":
      return "info";
    case "cancelled":
      return "error";
    default:
      return "warn";
  }
}
