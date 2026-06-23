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
export default async function CalendarPage() {
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
  const rows = (await listOrgScoped("events", session.orgId, {
    orderBy: "starts_at",
    ascending: true,
  })) as EventRow[];

  const events: CalendarEvent[] = rows.map((e) => ({
    id: e.id,
    title: e.name,
    start: e.starts_at,
    end: e.ends_at,
    tone: toneForStatus(e.event_state),
    href: `/studio/events/${e.id}`,
  }));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.calendar.eyebrow", undefined, "Operations")}
        title={t("console.calendar.title", undefined, "Calendar")}
        subtitle={
          rows.length === 1
            ? t("console.calendar.subtitleOne", { count: rows.length }, `${rows.length} event`)
            : t("console.calendar.subtitleOther", { count: rows.length }, `${rows.length} events`)
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
            action={<Button href="/studio/events/new">{t("console.calendar.newEvent", undefined, "+ New Event")}</Button>}
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
