export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { listEventTypes, listBookings } from "@/lib/db/scheduler";
import { MetricCard } from "@/components/ui/MetricCard";

type Row = {
  id: string;
  name: string;
  duration_minutes: number;
  location_kind: string;
  timezone: string;
  is_active: boolean;
  bookings: number;
};

export default async function SchedulerPage() {
  const session = await requireSession();
  const { t } = await getRequestT();
  const [eventTypes, bookings] = await Promise.all([listEventTypes(session.orgId), listBookings(session.orgId)]);

  const bookingCount = new Map<string, number>();
  for (const b of bookings) bookingCount.set(b.event_type_id, (bookingCount.get(b.event_type_id) ?? 0) + 1);
  const upcoming = bookings.filter(
    (b) => (b.booking_state === "booked" || b.booking_state === "rescheduled") && Date.parse(b.starts_at) > Date.now(),
  ).length;

  const rows: Row[] = eventTypes.map((e) => ({
    id: e.id,
    name: e.name,
    duration_minutes: e.duration_minutes,
    location_kind: e.location_kind,
    timezone: e.timezone,
    is_active: e.is_active,
    bookings: bookingCount.get(e.id) ?? 0,
  }));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.scheduler.eyebrow", undefined, "Operations")}
        title={t("console.scheduler.title", undefined, "Scheduler")}
        subtitle={t(
          "console.scheduler.subtitle",
          undefined,
          "Bookable event types with availability windows, buffers, and per-audience links. The default SOS scheduler for advance packets.",
        )}
        action={
          <Button href="/studio/scheduler/new" size="sm">
            {t("console.scheduler.newLabel", undefined, "+ New Event Type")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid">
          <MetricCard
            label={t("console.scheduler.metrics.eventTypes", undefined, "Event Types")}
            value={String(eventTypes.length)}
          />
          <MetricCard
            label={t("console.scheduler.metrics.active", undefined, "Active")}
            value={String(eventTypes.filter((e) => e.is_active).length)}
          />
          <MetricCard
            label={t("console.scheduler.metrics.upcoming", undefined, "Upcoming Bookings")}
            value={String(upcoming)}
          />
          <MetricCard
            label={t("console.scheduler.metrics.total", undefined, "Total Bookings")}
            value={String(bookings.length)}
          />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/studio/scheduler/${r.id}`}
          emptyLabel={t("console.scheduler.emptyLabel", undefined, "No Event Types Yet")}
          emptyDescription={t(
            "console.scheduler.emptyDescription",
            undefined,
            "Create a bookable slot type: duration, buffers, minimum notice, daily cap, and weekly availability. Every advance packet can point its SOS block here.",
          )}
          emptyAction={
            <Button href="/studio/scheduler/new" size="sm">
              {t("console.scheduler.createFirst", undefined, "Create Your First Event Type")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.scheduler.columns.name", undefined, "Name"),
              render: (r) => r.name,
            },
            {
              key: "duration_minutes",
              header: t("console.scheduler.columns.duration", undefined, "Duration"),
              render: (r) => `${r.duration_minutes} min`,
            },
            {
              key: "location_kind",
              header: t("console.scheduler.columns.location", undefined, "Location"),
              render: (r) => (
                <Badge variant="muted">
                  {r.location_kind === "call"
                    ? t("console.scheduler.locationCall", undefined, "Call")
                    : t("console.scheduler.locationOnSite", undefined, "On Site")}
                </Badge>
              ),
            },
            {
              key: "timezone",
              header: t("console.scheduler.columns.timezone", undefined, "Timezone"),
              render: (r) => <span className="font-mono text-xs">{r.timezone}</span>,
            },
            {
              key: "is_active",
              header: t("console.scheduler.columns.state", undefined, "State"),
              render: (r) => (
                <Badge variant={r.is_active ? "success" : "muted"}>
                  {r.is_active
                    ? t("console.scheduler.active", undefined, "Active")
                    : t("console.scheduler.paused", undefined, "Paused")}
                </Badge>
              ),
            },
            {
              key: "bookings",
              header: t("console.scheduler.columns.bookings", undefined, "Bookings"),
              render: (r) => String(r.bookings),
            },
          ]}
        />
      </div>
    </>
  );
}
