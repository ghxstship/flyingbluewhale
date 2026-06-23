import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import type { CalendarEvent } from "@/components/views/CalendarView";
import { ScheduleCalendarView } from "./ScheduleCalendarView";
import type { EventRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.schedule.title", undefined, "Schedule")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.schedule.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const rows = (await listOrgScoped("events", session.orgId, {
    orderBy: "starts_at",
    ascending: true,
  })) as EventRow[];

  // Hand the generic <CalendarView> a serializable, library-agnostic shape.
  // Status maps to the abstract `tone` palette so the component stays
  // domain-free.
  const calendarEvents: CalendarEvent[] = rows.map((e) => ({
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
        eyebrow={t("console.schedule.eyebrow", undefined, "Operations")}
        title={t("console.schedule.masterTitle", undefined, "Master Schedule")}
        subtitle={
          rows.length === 1
            ? t("console.schedule.subtitleOne", { count: rows.length }, `${rows.length} Event`)
            : t("console.schedule.subtitleOther", { count: rows.length }, `${rows.length} Events`)
        }
        action={
          <div className="flex gap-2">
            <Button href="/api/v1/schedule.ics" variant="secondary">
              {t("console.schedule.exportIcs", undefined, "Export .ics")}
            </Button>
            <Button href="/studio/events/new">{t("console.schedule.newEvent", undefined, "+ New Event")}</Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <ScheduleCalendarView events={calendarEvents} />

        <DataTable<EventRow>
          rows={rows}
          rowHref={(r) => `/studio/events/${r.id}`}
          columns={[
            {
              key: "name",
              header: t("console.schedule.col.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "starts",
              header: t("console.schedule.col.starts", undefined, "Starts"),
              render: (r) => formatDate(r.starts_at, "long"),
              className: "font-mono text-xs",
              accessor: (r) => r.starts_at,
            },
            {
              key: "ends",
              header: t("console.schedule.col.ends", undefined, "Ends"),
              render: (r) => formatDate(r.ends_at, "long"),
              className: "font-mono text-xs",
              accessor: (r) => r.ends_at,
            },
            {
              key: "event_state",
              header: t("console.schedule.col.event_state", undefined, "Status"),
              render: (r) => <StatusBadge status={r.event_state} />,
              accessor: (r) => r.event_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
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
    case "draft":
    case "scheduled":
    default:
      return "warn";
  }
}
