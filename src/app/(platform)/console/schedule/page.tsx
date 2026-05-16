import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import type { CalendarEvent } from "@/components/views/CalendarView";
import { ScheduleCalendarView } from "./ScheduleCalendarView";
import { ScheduleShareButton } from "./ScheduleShareActions";
import type { EventRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="Schedule" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
    tone: toneForStatus(e.status),
    href: `/console/events/${e.id}`,
  }));

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        title="Master Schedule"
        subtitle={`${rows.length} event${rows.length === 1 ? "" : "s"}`}
        action={
          <div className="flex gap-2">
            <ScheduleShareButton orgId={session.orgId} />
            <Button href="/api/v1/schedule.ics" variant="secondary">
              Export .ics
            </Button>
            <Button href="/console/events/new">+ New Event</Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <ScheduleCalendarView events={calendarEvents} />

        <DataTable<EventRow>
          rows={rows}
          rowHref={(r) => `/console/events/${r.id}`}
          columns={[
            { key: "name", header: "Name", render: (r) => r.name, accessor: (r) => r.name },
            {
              key: "starts",
              header: "Starts",
              render: (r) => formatDate(r.starts_at, "long"),
              className: "font-mono text-xs",
              accessor: (r) => r.starts_at,
            },
            {
              key: "ends",
              header: "Ends",
              render: (r) => formatDate(r.ends_at, "long"),
              className: "font-mono text-xs",
              accessor: (r) => r.ends_at,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <StatusBadge status={r.status} />,
              accessor: (r) => r.status,
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
