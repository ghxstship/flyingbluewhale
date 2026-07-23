export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtDate } from "@/components/detail/DetailShell";
import { urlFor } from "@/lib/urls";
import { getEventType, listAvailability, listBookings, NEXT_BOOKING_STATES } from "@/lib/db/scheduler";
import {
  addAvailabilityAction,
  removeAvailabilityAction,
  toggleActiveAction,
  transitionBookingAction,
} from "./actions";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function minuteLabel(minute: number): string {
  const h = String(Math.floor(minute / 60)).padStart(2, "0");
  const m = String(minute % 60).padStart(2, "0");
  return `${h}:${m}`;
}

export default async function EventTypePage({ params }: { params: Promise<{ eventTypeId: string }> }) {
  const { eventTypeId } = await params;
  const session = await requireSession();
  const { t } = await getRequestT();

  const eventType = await getEventType(session.orgId, eventTypeId);
  if (!eventType) notFound();
  const [windows, bookings] = await Promise.all([
    listAvailability(eventType.id),
    listBookings(session.orgId, eventType.id),
  ]);
  const bookingUrl = urlFor("marketing", `/book/${eventType.public_token}`);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.scheduler.eyebrow", undefined, "Operations")}
        title={eventType.name}
        subtitle={t(
          "console.scheduler.detail.subtitle",
          undefined,
          "Availability windows, booking rules, and the public booking link.",
        )}
        breadcrumbs={[
          { label: t("console.scheduler.title", undefined, "Scheduler"), href: "/studio/scheduler" },
          { label: eventType.name },
        ]}
        action={
          <form action={toggleActiveAction.bind(null, eventType.id)}>
            <input type="hidden" name="next" value={String(!eventType.is_active)} />
            <button type="submit" className="ps-btn ps-btn--sm">
              {eventType.is_active
                ? t("console.scheduler.detail.pause", undefined, "Pause Bookings")
                : t("console.scheduler.detail.resume", undefined, "Resume Bookings")}
            </button>
          </form>
        }
      />
      <div className="page-content max-w-5xl space-y-5">
        <div className="surface flex flex-wrap items-center gap-4 p-6 text-sm">
          <Badge variant={eventType.is_active ? "success" : "muted"}>
            {eventType.is_active
              ? t("console.scheduler.active", undefined, "Active")
              : t("console.scheduler.paused", undefined, "Paused")}
          </Badge>
          <span className="font-mono text-xs">
            {eventType.duration_minutes} min · {t("console.scheduler.detail.buffers", undefined, "buffers")}{" "}
            {eventType.buffer_before_minutes}/{eventType.buffer_after_minutes} ·{" "}
            {t("console.scheduler.detail.notice", undefined, "notice")} {eventType.min_notice_minutes}m
            {eventType.max_per_day ? ` · ${t("console.scheduler.detail.cap", undefined, "cap")} ${eventType.max_per_day}/d` : ""}
          </span>
          <span className="font-mono text-xs">{eventType.timezone}</span>
          <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="ms-auto font-mono text-xs underline">
            {t("console.scheduler.detail.bookingLink", undefined, "Public Booking Link")}
          </a>
        </div>

        <section className="space-y-3">
          <h3>{t("console.scheduler.detail.availability", undefined, "Availability")}</h3>
          {windows.length === 0 ? (
            <EmptyState
              title={t("console.scheduler.detail.noWindows", undefined, "No Windows")}
              description={t(
                "console.scheduler.detail.noWindowsDescription",
                undefined,
                "Without an open window nothing is bookable. Add weekly hours or a dated override.",
              )}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="ps-table w-full text-sm">
                <thead>
                  <tr>
                    <th>{t("console.scheduler.detail.columns.window", undefined, "Window")}</th>
                    <th>{t("console.scheduler.detail.columns.hours", undefined, "Hours")}</th>
                    <th>{t("console.scheduler.detail.columns.open", undefined, "Open")}</th>
                    <th className="text-end">{t("console.scheduler.detail.columns.actions", undefined, "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {windows.map((w) => (
                    <tr key={w.id}>
                      <td>
                        {w.override_date
                          ? `${t("console.scheduler.detail.override", undefined, "Override")} · ${w.override_date}`
                          : WEEKDAYS[w.weekday ?? 0]}
                      </td>
                      <td className="font-mono text-xs">
                        {minuteLabel(w.start_minute)}-{minuteLabel(w.end_minute)}
                      </td>
                      <td>
                        <Badge variant={w.is_open ? "success" : "error"}>
                          {w.is_open
                            ? t("console.scheduler.detail.open", undefined, "Open")
                            : t("console.scheduler.detail.blocked", undefined, "Blocked")}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <form action={removeAvailabilityAction.bind(null, eventType.id)} className="inline">
                          <input type="hidden" name="window_id" value={w.id} />
                          <button type="submit" className="ps-btn ps-btn--sm">
                            {t("common.remove", undefined, "Remove")}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <form
            action={addAvailabilityAction.bind(null, eventType.id)}
            className="surface flex flex-wrap items-end gap-3 p-6"
          >
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-[var(--p-text-2)]">
                {t("console.scheduler.detail.kind", undefined, "Kind")}
              </span>
              <select name="kind" className="ps-input ps-input--sm" defaultValue="weekly">
                <option value="weekly">{t("console.scheduler.detail.weekly", undefined, "Weekly")}</option>
                <option value="override">{t("console.scheduler.detail.override", undefined, "Override")}</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-[var(--p-text-2)]">
                {t("console.scheduler.detail.weekday", undefined, "Weekday")}
              </span>
              <select name="weekday" className="ps-input ps-input--sm" defaultValue="1">
                {WEEKDAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-[var(--p-text-2)]">
                {t("console.scheduler.detail.date", undefined, "Date (override)")}
              </span>
              <input type="date" name="override_date" className="ps-input ps-input--sm" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-[var(--p-text-2)]">
                {t("console.scheduler.detail.startMinute", undefined, "Start (min from midnight)")}
              </span>
              <input type="number" name="start_minute" defaultValue={540} min={0} max={1439} className="ps-input ps-input--sm" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-[var(--p-text-2)]">
                {t("console.scheduler.detail.endMinute", undefined, "End (min from midnight)")}
              </span>
              <input type="number" name="end_minute" defaultValue={1020} min={1} max={1440} className="ps-input ps-input--sm" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_open" defaultChecked />
              {t("console.scheduler.detail.openLabel", undefined, "Open")}
            </label>
            <button type="submit" className="ps-btn ps-btn--sm">
              {t("console.scheduler.detail.addWindow", undefined, "Add Window")}
            </button>
          </form>
        </section>

        <section className="space-y-3">
          <h3>{t("console.scheduler.detail.bookings", undefined, "Bookings")}</h3>
          {bookings.length === 0 ? (
            <EmptyState
              title={t("console.scheduler.detail.noBookings", undefined, "No Bookings Yet")}
              description={t(
                "console.scheduler.detail.noBookingsDescription",
                undefined,
                "Share the public booking link, or wire it into an advance packet's SOS block.",
              )}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="ps-table w-full text-sm">
                <thead>
                  <tr>
                    <th>{t("console.scheduler.detail.columns.invitee", undefined, "Invitee")}</th>
                    <th>{t("console.scheduler.detail.columns.when", undefined, "When")}</th>
                    <th>{t("console.scheduler.detail.columns.state", undefined, "Status")}</th>
                    <th className="text-end">{t("console.scheduler.detail.columns.actions", undefined, "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <div>{b.invitee_name ?? "—"}</div>
                        <div className="font-mono text-xs text-[var(--p-text-2)]">{b.invitee_email}</div>
                      </td>
                      <td className="font-mono text-xs">{fmtDate(b.starts_at)}</td>
                      <td>
                        <StatusBadge status={b.booking_state} />
                      </td>
                      <td className="text-end">
                        <div className="inline-flex gap-1">
                          {NEXT_BOOKING_STATES[b.booking_state]
                            .filter((to) => to !== "rescheduled")
                            .map((to) => (
                              <form key={to} action={transitionBookingAction.bind(null, eventType.id)} className="inline">
                                <input type="hidden" name="booking_id" value={b.id} />
                                <input type="hidden" name="from" value={b.booking_state} />
                                <input type="hidden" name="to" value={to} />
                                <button type="submit" className="ps-btn ps-btn--sm">
                                  {to === "cancelled"
                                    ? t("console.scheduler.detail.cancel", undefined, "Cancel")
                                    : t("console.scheduler.detail.noShow", undefined, "No Show")}
                                </button>
                              </form>
                            ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
